import { Request, Response } from 'express';
import { botExecutionModel } from '../models/botExecution.model';
import { tramiteModel } from '../models/tramite.model';
import { deviceModel } from '../models/device.model';
import { botLogModel } from '../models/botLog.model';
import { botExecutorService } from '../services/bot-executor.service';
import { EjecutarBotRequest } from '../types';

export class BotController {
  // Execute bot (admin only)
  static async execute(req: Request, res: Response): Promise<void> {
    let responseSent = false;

    try {
      if (!req.usuario) {
        res.status(401).json({
          success: false,
          error: 'No autenticado',
        });
        return;
      }

      const { maxTramites }: EjecutarBotRequest = req.body;

      // Check if there's already an execution in progress
      const inProgress = await botExecutionModel.getInProgress();
      if (inProgress) {
        res.status(400).json({
          success: false,
          error: 'Ya hay una ejecución del bot en progreso',
          data: inProgress,
        });
        return;
      }

      // Get pending trámites
      const tramitesPendientes = await tramiteModel.getPendingForProcessing(maxTramites);

      if (tramitesPendientes.length === 0) {
        res.json({
          success: true,
          message: 'No hay trámites pendientes para procesar',
          data: {
            total: 0,
            procesados: 0,
            exitosos: 0,
            errores: 0,
          },
        });
        return;
      }

      // Check if there are available devices
      const availableDevices = await deviceModel.getAvailable();
      if (!availableDevices.length) {
        res.status(400).json({
          success: false,
          error: 'No hay dispositivos disponibles para ejecutar el bot',
        });
        return;
      }

      // Create bot execution record
      const ejecucion = await botExecutionModel.create(req.usuario.id);
      await botExecutionModel.setTotalTramites(ejecucion.id, tramitesPendientes.length);
      await botExecutionModel.addLog(ejecucion.id, `Se encontraron ${tramitesPendientes.length} trámites pendientes`);

      // Send response immediately (async processing)
      responseSent = true;
      res.json({
        success: true,
        message: `Iniciando procesamiento de ${tramitesPendientes.length} trámites`,
        data: {
          ejecucionId: ejecucion.id,
          totalTramites: tramitesPendientes.length,
        },
      });

      // Execute bot asynchronously (fire and forget)
      setImmediate(() => {
        BotController.executeAsync(ejecucion.id, tramitesPendientes);
      });
    } catch (error) {
      console.error('Error ejecutando bot:', error);
      if (!responseSent) {
        res.status(500).json({
          success: false,
          error: 'Error interno del servidor',
        });
      }
    }
  }

  // Async execution (runs in background)
  private static async executeAsync(ejecucionId: string, tramites: any[]) {
    try {
      await botExecutionModel.addLog(ejecucionId, '🚀 Iniciando procesamiento asíncrono...');

      // Track execution state
      let currentCompletados = 0;
      let currentErrores = 0;

      const result = await botExecutorService.executeBatch(tramites, async (current, total, tramite, botLogs) => {
        // Determine if this trámite was successful or had errors by checking the logs
        const hadError = botLogs && botLogs.some((log: string) =>
          log.toLowerCase().includes('error') ||
          log.toLowerCase().includes('falló') ||
          log.toLowerCase().includes('failed')
        );

        // Update counters
        if (hadError) {
          currentErrores++;
          await botExecutionModel.incrementErrores(ejecucionId);
        } else {
          currentCompletados++;
          await botExecutionModel.incrementCompletados(ejecucionId);
        }

        // Add progress log with real-time percentage
        const processed = currentCompletados + currentErrores;
        const progressPercent = Math.round((processed / total) * 100);

        await botExecutionModel.addLog(
          ejecucionId,
          `📊 Progreso: ${processed}/${total} (${progressPercent}%) - ✅ ${currentCompletados} exitosos, ❌ ${currentErrores} errores`
        );

        // Add detailed logs from this trámite if available
        if (botLogs && botLogs.length > 0) {
          await botExecutionModel.addLog(
            ejecucionId,
            `🔄 Trámite ${processed}/${total}: DN ${tramite.dn} - ${tramite.nombre} ${tramite.apellidoPaterno}`
          );

          // Get the last few relevant logs
          const relevantLogs = botLogs.slice(-15); // Last 15 logs for more detail
          for (const log of relevantLogs) {
            // Only add meaningful logs
            const logText = log.replace(/^\[.*?\]\s*/, '').trim(); // Remove timestamp for cleaner display
            if (logText && logText.length > 5 && !logText.includes('[BOT') && !logText.includes('timestamp')) {
              await botExecutionModel.addLog(ejecucionId, `  └─ ${logText}`);
            }
          }
        }
      });

      // Update execution record
      await botExecutionModel.addLog(ejecucionId, '✅ Procesamiento finalizado');
      await botExecutionModel.addLog(
        ejecucionId,
        `📈 Resultados finales: ${result.success} exitosos, ${result.errors} errores de ${result.success + result.errors} totales`
      );

      if (result.errors === 0) {
        await botExecutionModel.markAsCompleted(ejecucionId);
      } else {
        await botExecutionModel.markAsFailed(
          ejecucionId,
          `${result.errors} de ${result.success + result.errors} trámites fallaron`
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      await botExecutionModel.addLog(ejecucionId, `❌ Error: ${errorMessage}`);
      await botExecutionModel.markAsFailed(ejecucionId, errorMessage);
    }
  }

  // Get bot status
  static async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const inProgress = await botExecutionModel.getInProgress();

      if (!inProgress) {
        res.json({
          success: true,
          data: {
            ejecutando: false,
            ejecucion: null,
          },
        });
        return;
      }

      // Calculate progress percentage
      const progress = inProgress.totalTramites > 0
        ? Math.round(((inProgress.completados + inProgress.errores) / inProgress.totalTramites) * 100)
        : 0;

      // Get logs from the execution
      const logs = inProgress.logs || [];

      res.json({
        success: true,
        data: {
          ejecutando: true,
          ejecucion: {
            ...inProgress,
            progreso: progress,
            logs: logs, // Include logs in the response
          },
        },
      });
    } catch (error) {
      console.error('Error obteniendo estado del bot:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      });
    }
  }

  // Cancel bot execution (admin only)
  static async cancel(req: Request, res: Response): Promise<void> {
    try {
      if (!req.usuario) {
        res.status(401).json({
          success: false,
          error: 'No autenticado',
        });
        return;
      }

      // Get in-progress execution
      const inProgress = await botExecutionModel.getInProgress();

      if (!inProgress) {
        res.status(400).json({
          success: false,
          error: 'No hay ejecución del bot en progreso',
        });
        return;
      }

      // Mark execution as cancelled
      await botExecutionModel.markAsCancelled(inProgress.id);

      // Release all busy devices
      const devices = await deviceModel.getAll();
      await Promise.all(devices.map(async (device) => {
        if (device.status === 'busy') {
          await deviceModel.markAsAvailable(device.id);
        }
      }));

      // Mark any processing trámites as pendiente again
      const tramitesProcesando = await tramiteModel.getAll({ estado: 'procesando' });
      await Promise.all(tramitesProcesando.map(async (tramite: any) => {
        await tramiteModel.update(tramite.id, { estado: 'pendiente' });
      }));

      res.json({
        success: true,
        message: 'Ejecución del bot cancelada exitosamente',
        data: {
          ejecucionId: inProgress.id,
        },
      });
    } catch (error) {
      console.error('Error cancelando ejecución del bot:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      });
    }
  }

  // Get bot execution history
  static async getHistory(req: Request, res: Response): Promise<void> {
    try {
      const executions = await botExecutionModel.getAll();

      res.json({
        success: true,
        data: executions,
      });
    } catch (error) {
      console.error('Error obteniendo historial de ejecuciones:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      });
    }
  }

  // Get bot execution by ID
  static async getExecutionById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const execution = await botExecutionModel.findById(id);

      if (!execution) {
        res.status(404).json({
          success: false,
          error: 'Ejecución no encontrada',
        });
        return;
      }

      res.json({
        success: true,
        data: execution,
      });
    } catch (error) {
      console.error('Error obteniendo ejecución:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      });
    }
  }

  // Get devices
  static async getDevices(req: Request, res: Response): Promise<void> {
    try {
      const devices = await deviceModel.getAll();
      const stats = await deviceModel.getStats();

      res.json({
        success: true,
        data: {
          devices,
          stats,
        },
      });
    } catch (error) {
      console.error('Error obteniendo dispositivos:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      });
    }
  }

  // Add device (admin only)
  static async addDevice(req: Request, res: Response): Promise<void> {
    try {
      const { udid, name } = req.body;

      if (!udid || !name) {
        res.status(400).json({
          success: false,
          error: 'UDID y nombre son obligatorios',
        });
        return;
      }

      const device = await deviceModel.create({ udid, name });

      res.status(201).json({
        success: true,
        data: device,
        message: 'Dispositivo agregado exitosamente',
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      console.error('Error agregando dispositivo:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      });
    }
  }

  // Delete device (admin only)
  static async deleteDevice(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const deleted = await deviceModel.delete(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Dispositivo no encontrado',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Dispositivo eliminado exitosamente',
      });
    } catch (error) {
      console.error('Error eliminando dispositivo:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      });
    }
  }

  // Get bot logs for a specific trámite
  static async getTramiteLogs(req: Request, res: Response): Promise<void> {
    try {
      const { idTramite } = req.params;

      const logs = await botLogModel.getByTramiteId(idTramite);

      res.json({
        success: true,
        data: logs,
      });
    } catch (error) {
      console.error('Error obteniendo logs del trámite:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      });
    }
  }
}
