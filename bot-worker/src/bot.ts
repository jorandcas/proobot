import type { Browser } from "webdriverio";
import { createDriver } from "./config/appium";
import { log, ENV, updateEnvFromRequest } from "./config/env";
import { login } from "./flows/login";
import { navigateToPortSinDnTransito } from "./flows/post-login";
import { fillBusquedaPortForm } from "./flows/busqueda-port";
import { handleInterconexionModal } from "./flows/handle-modal";
import { bloquearICC } from "./flows/bloqueo-icc";
import { continuarTramite } from "./flows/continuar-tramite";
import { seccionLinea } from "./flows/seccion-linea";
import { seccionDatosPersonales } from "./flows/seccion-datos-personales";
import { seccionDocumentos } from "./flows/seccion-documentos";
import { seccionEnvio } from "./flows/seccion-envio";

export interface BotExecutionRequest {
  SEARCH_DN: string;
  ICC: string;
  FVC_FECHA: string;
  LINEA_NIP: string;
  DATOS_NOMBRE: string;
  DATOS_NOMBRE_SEGUNDO?: string;
  DATOS_APELLIDO_PATERNO: string;
  DATOS_APELLIDO_MATERNO?: string;
  DATOS_CURP: string;
  DATOS_TELEFONO: string;
  DATOS_TELEFONO_2?: string;
  DATOS_GENERO?: string;
  DATOS_EMAIL?: string;
  DATOS_FECHA_NACIMIENTO: string;
}

export interface BotExecutionResult {
  success: boolean;
  folioId?: string;
  error?: string;
  logs?: string[];
}

let isExecuting = false;
let currentDriver: Browser | null = null;

/**
 * Execute bot for a single trámite
 */
export async function executeBot(request: BotExecutionRequest): Promise<BotExecutionResult> {
  // Check if bot is already executing
  if (isExecuting) {
    return {
      success: false,
      error: "Bot is already executing a trámite. Please wait.",
    };
  }

  const logs: string[] = [];
  const originalLog = { ...log };

  try {
    isExecuting = true;

    // Override console.log to capture logs
    console.log = (...args: any[]) => {
      const msg = args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' ');
      logs.push(msg);
      originalLog.info(msg);
    };

    // Update ENV from request
    updateEnvFromRequest(request);

    log.step("Iniciando bot worker...");
    log.info(`Worker ID: ${ENV.WORKER_ID}`);
    log.info(`Device UDID: ${ENV.DEVICE_UDID}`);
    log.info(`DN: ${ENV.SEARCH_DN}`);
    log.info(`Cliente: ${ENV.DATOS_NOMBRE} ${ENV.DATOS_APELLIDO_PATERNO}`);

    // Create driver
    const driver = await createDriver();
    currentDriver = driver;

    try {
      log.success("Sesión iniciada");

      // Execute flow
      log.step("PASO 1: Login");
      await login(driver, true);

      log.step("PASO 2: Navegando a Porta SIN DN Transitorio");
      await navigateToPortSinDnTransito(driver);

      log.step("PASO 3: Llenando formulario de búsqueda");
      await fillBusquedaPortForm(driver);

      log.step("PASO 4: Procesando resultado de interconexión");
      await handleInterconexionModal(driver);

      log.step("PASO 5: Bloqueo ICC");
      await bloquearICC(driver);

      log.step("PASO 6: Continuar Trámite");
      await continuarTramite(driver);

      log.step("PASO 7: Sección 1 - Línea");
      await seccionLinea(driver, ENV.LINEA_NIP, ENV.FVC_FECHA);

      log.step("PASO 8: Sección 2 - Datos Personales");
      await seccionDatosPersonales(driver);

      log.step("PASO 9: Sección 3 - Documentos");
      await seccionDocumentos(driver);

      log.step("PASO 10: Sección 4 - Envío");
      const envioResult = await seccionEnvio(driver);

      // Validate result
      if (!envioResult.success) {
        log.error(`Error: ${envioResult.message}`);

        if (envioResult.errorMessage) {
          log.error(`Mensaje del APK: ${envioResult.errorMessage}`);
          log.error(`Es error de datos: ${envioResult.isDataError ? 'SÍ' : 'NO'}`);

          return {
            success: false,
            error: envioResult.errorMessage,
            logs,
          };
        }

        return {
          success: false,
          error: envioResult.message,
          logs,
        };
      }

      log.success(`Flujo completado exitosamente`);
      log.success(`FolioID del trámite: ${envioResult.folioId}`);

      return {
        success: true,
        folioId: envioResult.folioId,
        logs,
      };

    } finally {
      await driver.deleteSession();
      log.info("Sesión cerrada");
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    log.error(`Error en trámite: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
      logs,
    };

  } finally {
    isExecuting = false;
    currentDriver = null;
    // Restore console.log
    console.log = originalLog.info;
  }
}

/**
 * Get current execution status
 */
export function getExecutionStatus(): { isExecuting: boolean; hasDriver: boolean } {
  return {
    isExecuting,
    hasDriver: currentDriver !== null,
  };
}

/**
 * Cancel current execution (emergency stop)
 */
export async function cancelExecution(): Promise<void> {
  if (currentDriver) {
    try {
      await currentDriver.deleteSession();
    } catch (error) {
      // Ignore errors during cleanup
    }
    currentDriver = null;
  }
  isExecuting = false;
}
