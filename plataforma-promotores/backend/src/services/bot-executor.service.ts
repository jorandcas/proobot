import { tramiteModel } from '../models/tramite.model';
import { botLogModel } from '../models/botLog.model';
import { devicePoolService } from './device-pool.service';
import { Tramite } from '../types';

interface BotExecutionResult {
  success: boolean;
  error?: string;
  logs?: string[];
}

export class BotExecutorService {
  // Execute bot for a single trámite
  async executeTramite(tramite: Tramite): Promise<BotExecutionResult> {
    // Get available device
    const device = await devicePoolService.getAvailableDevice();

    if (!device) {
      return {
        success: false,
        error: 'No hay dispositivos disponibles',
      };
    }

    // Mark device as busy
    await devicePoolService.markDeviceBusy(device.id);

    // Create bot log
    const botLog = await botLogModel.create({
      idTramite: tramite.id,
      idDevice: device.id,
    });

    try {
      await botLogModel.addLog(botLog.id, `Iniciando procesamiento del trámite ${tramite.id}`);
      await botLogModel.addLog(botLog.id, `DN: ${tramite.dn}, Cliente: ${tramite.nombre} ${tramite.apellidoPaterno}`);
      await botLogModel.addLog(botLog.id, `Device: ${device.name} (${device.udid})`);

      // Get bot worker URL from device configuration
      const workerUrl = device.workerUrl || `http://bot-worker-${device.id}`;
      const executeUrl = `${workerUrl}/execute`;

      await botLogModel.addLog(botLog.id, `Llamando a bot worker: ${executeUrl}`);

      // Prepare request body
      const requestBody = {
        SEARCH_DN: tramite.dn,
        ICC: tramite.icc,
        FVC_FECHA: tramite.fvcFecha,
        LINEA_NIP: tramite.nip,
        DATOS_NOMBRE: tramite.nombre,
        DATOS_NOMBRE_SEGUNDO: tramite.nombreSegundo || '',
        DATOS_APELLIDO_PATERNO: tramite.apellidoPaterno,
        DATOS_APELLIDO_MATERNO: tramite.apellidoMaterno || 'R',
        DATOS_CURP: tramite.curp,
        DATOS_TELEFONO: tramite.telefono,
        DATOS_TELEFONO_2: tramite.telefono2 || '',
        DATOS_GENERO: tramite.genero,
        DATOS_EMAIL: tramite.email || '',
        DATOS_FECHA_NACIMIENTO: tramite.fechaNacimiento,
      };

      await botLogModel.addLog(botLog.id, `Enviando solicitud HTTP al worker...`);

      // Execute bot via HTTP request
      const result = await this.callBotWorker(executeUrl, requestBody, botLog.id);

      if (result.success) {
        // Mark trámite as completed
        await tramiteModel.markAsCompleted(
          tramite.id,
          `Procesamiento exitoso. FolioID: ${result.folioId}`,
          botLog.id
        );
        await botLogModel.markAsCompleted(botLog.id);
        await botLogModel.addLog(botLog.id, `Trámite ${tramite.id} completado exitosamente`);

        return {
          success: true,
          logs: (await botLogModel.findById(botLog.id))?.logs || [],
        };
      } else {
        // Determinar si es error de datos (requiere corrección del promotor) o error técnico
        const errorMsg = result.error || 'Error desconocido';
        const datosError = this.esErrorDeDatos(errorMsg);

        if (datosError.esErrorDatos) {
          // Error de datos - requiere corrección del promotor
          await tramiteModel.markAsErrorWithCorrection(
            tramite.id,
            errorMsg,
            botLog.id,
            datosError.mensajeCorreccion
          );
        } else {
          // Error técnico - no requiere intervención del promotor
          await tramiteModel.markAsError(tramite.id, errorMsg, botLog.id);
        }

        await botLogModel.markAsFailed(botLog.id, errorMsg);
        await botLogModel.addLog(botLog.id, `Trámite ${tramite.id} falló: ${errorMsg}`);

        return {
          success: false,
          error: errorMsg,
          logs: (await botLogModel.findById(botLog.id))?.logs || [],
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

      // Determinar si es error de datos (requiere corrección del promotor) o error técnico
      const datosError = this.esErrorDeDatos(errorMessage);

      if (datosError.esErrorDatos) {
        // Error de datos - requiere corrección del promotor
        await tramiteModel.markAsErrorWithCorrection(
          tramite.id,
          errorMessage,
          botLog.id,
          datosError.mensajeCorreccion
        );
      } else {
        // Error técnico - no requiere intervención del promotor
        await tramiteModel.markAsError(tramite.id, errorMessage, botLog.id);
      }

      await botLogModel.markAsFailed(botLog.id, errorMessage);
      await botLogModel.addLog(botLog.id, `Error en trámite ${tramite.id}: ${errorMessage}`);

      return {
        success: false,
        error: errorMessage,
        logs: (await botLogModel.findById(botLog.id))?.logs || [],
      };
    } finally {
      // Always mark device as available again
      await devicePoolService.markDeviceAvailable(device.id);
    }
  }

  // Call bot worker via HTTP
  private async callBotWorker(
    workerUrl: string,
    requestBody: Record<string, string>,
    botLogId: string
  ): Promise<{ success: boolean; folioId?: string; error?: string; logs?: string[] }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes timeout

      const response = await fetch(workerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Capture logs from worker response
      if (data.logs && Array.isArray(data.logs)) {
        await botLogModel.addLog(botLogId, `Logs recibidos del worker: ${data.logs.length} entradas`);

        // Add logs to bot log (limit to last 200)
        const timestamp = new Date().toISOString();
        const limitedLogs = data.logs.slice(-200);
        const logEntries = limitedLogs.map((log: string) => `[${timestamp}] [WORKER] ${log}`);

        const botLog = await botLogModel.findById(botLogId);
        if (botLog) {
          await botLogModel.update(botLogId, { logs: [...(botLog.logs || []), ...logEntries] });
        }
      }

      if (data.success) {
        return {
          success: true,
          folioId: data.folioId,
        };
      } else {
        return {
          success: false,
          error: data.error || 'Error desconocido del worker',
        };
      }

    } catch (error: any) {
      await botLogModel.addLog(botLogId, `Error llamando al bot worker: ${error.message}`);

      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Timeout: El bot worker tardó más de 5 minutos',
        };
      }

      return {
        success: false,
        error: `Error de comunicación con el bot worker: ${error.message}`,
      };
    }
  }

  // Execute multiple trámites (batch processing)
  async executeBatch(
    tramites: Tramite[],
    onProgress?: (current: number, total: number, tramite: Tramite, botLogs?: string[]) => void
  ): Promise<{
    success: number;
    errors: number;
    results: Array<{ tramiteId: string; success: boolean; error?: string; botLogId?: string }>;
  }> {
    const results = [];
    let success = 0;
    let errors = 0;

    for (let i = 0; i < tramites.length; i++) {
      const tramite = tramites[i];

      // Execute trámite
      const result = await this.executeTramite(tramite);

      // Get the bot log for this trámite to extract logs
      const botLogs = await botLogModel.getByTramiteId(tramite.id);
      const botLogId = botLogs.length > 0 ? botLogs[0].id : undefined;
      const logMessages = botLogs.length > 0 ? botLogs[0].logs : [];

      results.push({
        tramiteId: tramite.id,
        success: result.success,
        error: result.error,
        botLogId,
      });

      if (result.success) {
        success++;
      } else {
        errors++;
      }

      // Update progress with detailed logs
      if (onProgress) {
        onProgress(i + 1, tramites.length, tramite, logMessages);
      }

      // Small delay between trámites
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return {
      success,
      errors,
      results,
    };
  }

  // Determine if an error is due to incorrect data (promotor can fix) or technical error
  private esErrorDeDatos(errorMsg: string): { esErrorDatos: boolean; mensajeCorreccion: string } {
    // Log para debugging
    console.log(`[bot-executor] Analizando error: "${errorMsg}"`);

    // Check for CURP >7 trámites error (prioridad alta - verificar primero)
    if (errorMsg.includes('CURP del cliente cuenta con') ||
        errorMsg.includes('más de 7 trámites') ||
        errorMsg.includes('mas de 7 tramites') ||
        errorMsg.includes('mas de 7 trámites')) {
      return {
        esErrorDatos: true,
        mensajeCorreccion: 'El CURP tiene más de 7 trámites de portabilidad en los últimos 3 meses. Por favor, verifica el CURP o intenta con un cliente diferente.'
      };
    }

    // Check for CURP-related errors
    if (errorMsg.includes('CURP')) {
      return {
        esErrorDatos: true,
        mensajeCorreccion: 'Error con el CURP proporcionado. Por favor, verifica los datos y corrige si es necesario.'
      };
    }

    // Check for DN-related errors
    if (errorMsg.includes('DN') && (errorMsg.includes('no encontrado') || errorMsg.includes('no existe'))) {
      return {
        esErrorDatos: true,
        mensajeCorreccion: 'El DN no fue encontrado en el sistema. Por favor, verifica el número e intenta nuevamente.'
      };
    }

    // Check for ICC-related errors
    if (errorMsg.includes('ICC') && (errorMsg.includes('inválido') || errorMsg.includes('no válido') || errorMsg.includes('invalid'))) {
      return {
        esErrorDatos: true,
        mensajeCorreccion: 'El código ICC de la SIM no es válido. Por favor, escanea nuevamente el código de barras.'
      };
    }

    // Check for NIP-related errors
    if (errorMsg.includes('NIP') && (errorMsg.includes('incorrecto') || errorMsg.includes('inválido') || errorMsg.includes('invalid'))) {
      return {
        esErrorDatos: true,
        mensajeCorreccion: 'El NIP proporcionado es incorrecto. Por favor, verifica e ingresa el NIP correcto.'
      };
    }

    // Check for personal data validation errors
    if (errorMsg.includes('nombre') && errorMsg.includes('no válido') ||
        errorMsg.includes('apellido') && errorMsg.includes('no válido') ||
        errorMsg.includes('fecha de nacimiento') && errorMsg.includes('no válida')) {
      return {
        esErrorDatos: true,
        mensajeCorreccion: 'Error en los datos personales ingresados. Por favor, verifica nombre, apellidos y fecha de nacimiento.'
      };
    }

    // Check for phone-related errors
    if ((errorMsg.includes('teléfono') || errorMsg.includes('telefono')) &&
        (errorMsg.includes('inválido') || errorMsg.includes('incorrecto') || errorMsg.includes('invalid'))) {
      return {
        esErrorDatos: true,
        mensajeCorreccion: 'Error en el número de teléfono. Por favor, verifica e ingresa un número válido de 10 dígitos.'
      };
    }

    // Check for generic Movistar Onix validation errors
    if (errorMsg.includes('Lista de errores:') || errorMsg.includes('Error. Lista de errores:')) {
      return {
        esErrorDatos: true,
        mensajeCorreccion: 'Error de validación en los datos. Por favor, verifica toda la información ingresada e intenta nuevamente.'
      };
    }

    // Default: technical error (not fixable by promotor)
    return {
      esErrorDatos: false,
      mensajeCorreccion: ''
    };
  }
}

export const botExecutorService = new BotExecutorService();
