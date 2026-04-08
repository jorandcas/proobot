import type { Browser } from "webdriverio";
import { SEL, log, TIMEOUTS } from "@poc-login/config";
import {
    safeClick,
    waitForScreenStable,
} from "@poc-login/core";
import { findAndClickButton } from "@poc-login/core";

export interface EnvioResult {
    success: boolean;
    folioId?: string;
    message: string;
    isDataError?: boolean;
    errorMessage?: string;
}

/**
 * Sección 4: Envío - Click en ENVIAR para finalizar el trámite
 * Valida que aparezca el diálogo de éxito con el FolioID
 */
export async function seccionEnvio(driver: Browser): Promise<EnvioResult> {
    try {
        log.step("📤 Sección 4: Envío");

        log.info("Verificando sección de Envío...");
        await waitForScreenStable(driver, 1000, 500, 15000);

        // Click en ENVIAR para finalizar
        log.info("Haciendo click en ENVIAR...");
        await safeClick(
            driver,
            SEL.btnEnviar,
            "botón ENVIAR",
            { timeout: 15000 }
        );
        log.success("✓ Click en ENVIAR realizado");

        // Esperar y validar diálogo de éxito con FolioID O diálogo de error
        log.info("⏳ Esperando diálogo de confirmación o error...");
        const result = await esperarDialogoResultado(driver);

        if (!result.success) {
            log.error(`❌ Error detectado: ${result.message}`);
            return {
                success: false,
                message: result.message,
                isDataError: result.isDataError,
                errorMessage: result.errorMessage
            };
        }

        log.success(`✓ Trámite enviado exitosamente - FolioID: ${result.folioId}`);

        return {
            success: true,
            folioId: result.folioId,
            message: `Trámite enviado exitosamente con FolioID: ${result.folioId}`
        };

    } catch (error) {
        log.error(`Error en sección Envío: ${(error as Error).message}`);
        throw error;
    }
}

interface DialogoResultado {
    success: boolean;
    folioId?: string;
    message: string;
    isDataError?: boolean;
    errorMessage?: string;
}

/**
 * Espera y valida el diálogo de éxito con el FolioID O detecta diálogos de error
 * Devuelve un objeto con el resultado (éxito con FolioID o error con mensaje)
 */
async function esperarDialogoResultado(driver: Browser): Promise<DialogoResultado> {
    const maxAttempts = 120; // 120 intentos × 500ms = 60 segundos
    const waitMs = TIMEOUTS.MODALS.CHECK_INTERVAL;

    log.info(`Buscando diálogo de resultado (éxito o error) - Tiempo máximo: ${maxAttempts * waitMs / 1000}s...`);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        // Cada 5 segundos, mostrar progreso
        if (attempt % 10 === 1) {
            log.info(`⏳ Esperando diálogo de resultado... (${attempt * waitMs / 1000}s / ${maxAttempts * waitMs / 1000}s)`);
        }

        try {
            // PRIMERO: Verificar si hay un diálogo de error (prioridad alta)
            const errorResult = await detectarDialogoError(driver);
            if (errorResult) {
                log.error(`❌ Diálogo de error detectado: ${errorResult.errorMessage}`);
                // Cerrar el diálogo de error
                await cerrarDialogoError(driver);
                return errorResult;
            }

            // SEGUNDO: Buscar diálogo de éxito con FolioID
            // Estrатегia 1: Buscar por texto característico "Tramite enviado correctamente a ONIX"
            const dialogByText = await driver.$(SEL.dialogSuccessText);
            if (await dialogByText.isDisplayed().catch(() => false)) {
                log.success("✓ Diálogo de éxito detectado por texto característico");

                // Extraer el mensaje completo
                const messageElement = await driver.$(SEL.dialogSuccessMessage);
                const fullMessage = await messageElement.getText();

                // Extraer FolioID usando regex
                const folioMatch = fullMessage.match(/FolioID:\s*(\d+)/);
                if (folioMatch) {
                    const folioId = folioMatch[1];
                    log.success(`✓ FolioID extraído: ${folioId}`);

                    // Cerrar el diálogo haciendo click en el botón Aceptar
                    await cerrarDialogoExito(driver);
                    return {
                        success: true,
                        folioId,
                        message: `Trámite enviado con FolioID: ${folioId}`
                    };
                }
            }

            // Estrategia 2: Buscar por presencia de "FolioID:"
            const dialogByFolio = await driver.$(SEL.dialogSuccessFolio);
            if (await dialogByFolio.isDisplayed().catch(() => false)) {
                log.success("✓ Diálogo de éxito detectado por FolioID");

                // Extraer el mensaje completo
                const messageElement = await driver.$(SEL.dialogSuccessMessage);
                const fullMessage = await messageElement.getText();

                // Extraer FolioID usando regex
                const folioMatch = fullMessage.match(/FolioID:\s*(\d+)/);
                if (folioMatch) {
                    const folioId = folioMatch[1];
                    log.success(`✓ FolioID extraído: ${folioId}`);

                    // Cerrar el diálogo haciendo click en el botón Aceptar
                    await cerrarDialogoExito(driver);
                    return {
                        success: true,
                        folioId,
                        message: `Trámite enviado con FolioID: ${folioId}`
                    };
                }
            }

            // Estrategia 3: Buscar directamente por el elemento del mensaje
            const messageElement = await driver.$(SEL.dialogSuccessMessage);
            if (await messageElement.isDisplayed().catch(() => false)) {
                const messageText = await messageElement.getText();

                // Verificar que contiene el texto de éxito
                if (messageText.includes("Tramite enviado correctamente") ||
                    messageText.includes("FolioID:")) {

                    log.success("✓ Diálogo de éxito detectado por elemento de mensaje");

                    // Extraer FolioID usando regex
                    const folioMatch = messageText.match(/FolioID:\s*(\d+)/);
                    if (folioMatch) {
                        const folioId = folioMatch[1];
                        log.success(`✓ FolioID extraído: ${folioId}`);

                        // Cerrar el diálogo haciendo click en el botón Aceptar
                        await cerrarDialogoExito(driver);
                        return {
                            success: true,
                            folioId,
                            message: `Trámite enviado con FolioID: ${folioId}`
                        };
                    }
                }
            }

        } catch (e) {
            // Continuar intentando
        }

        // Esperar entre intentos
        await driver.pause(waitMs);
    }

    log.error(`❌ No se detectó ningún diálogo después de ${maxAttempts * waitMs / 1000} segundos`);
    return {
        success: false,
        message: "No se detectó ningún diálogo (éxito o error) después del envío",
        isDataError: false
    };
}

/**
 * Detecta si hay un diálogo de error visible y captura el mensaje
 * Retorna null si no hay diálogo de error, o un objeto con la información del error
 */
async function detectarDialogoError(driver: Browser): Promise<DialogoResultado | null> {
    try {
        // Buscar el elemento de mensaje del diálogo
        const messageElement = await driver.$(SEL.dialogErrorMessage);
        if (!(await messageElement.isDisplayed().catch(() => false))) {
            return null;
        }

        // Obtener el texto completo del mensaje
        const messageText = await messageElement.getText();
        log.info(`🔍 Verificando posible diálogo de error: "${messageText}"`);

        // Verificar si es un diálogo de error buscando textos característicos
        const esError = messageText.includes("Error") ||
                       messageText.includes("Lista de errores:") ||
                       messageText.includes("CURP del cliente cuenta con") ||
                       messageText.includes("no es válido") ||
                       messageText.includes("inválido") ||
                       messageText.includes("incorrecto");

        if (!esError) {
            return null;
        }

        // Determinar si es un error de datos (requiere corrección del promotor)
        const esErrorDatos = messageText.includes("CURP") ||
                             messageText.includes("DN") ||
                             messageText.includes("ICC") ||
                             messageText.includes("NIP") ||
                             messageText.includes("nombre") ||
                             messageText.includes("apellido") ||
                             messageText.includes("teléfono");

        log.error(`❌ Diálogo de error detectado: ${messageText}`);

        return {
            success: false,
            message: "El APK mostró un error al procesar el trámite",
            isDataError: esErrorDatos,
            errorMessage: messageText
        };

    } catch (e) {
        // Error al intentar detectar, continuar
        return null;
    }
}

/**
 * Cierra el diálogo de error haciendo click en el botón Aceptar
 */
async function cerrarDialogoError(driver: Browser): Promise<void> {
    try {
        log.info("Cerrando diálogo de error...");

        await findAndClickButton(
            driver,
            [
                { selector: SEL.dialogErrorBtnAceptar, name: "ID android:id/button1" },
                { selector: SEL.btnAceptarByText, name: "texto 'Aceptar'" },
                { selector: SEL.btnAceptarByOK, name: "texto 'OK'" },
            ],
            "botón Aceptar del diálogo de error",
            { throwIfNotFound: false, pauseAfter: 500 }
        );
    } catch (error) {
        log.warn(`⚠ Error cerrando diálogo de error: ${(error as Error).message}`);
    }
}

/**
 * Cierra el diálogo de éxito haciendo click en el botón Aceptar
 */
async function cerrarDialogoExito(driver: Browser): Promise<void> {
    try {
        log.info("Cerrando diálogo de éxito...");

        await findAndClickButton(
            driver,
            [
                { selector: SEL.dialogSuccessBtnAceptar, name: "ID android:id/button1" },
                { selector: SEL.btnAceptarByText, name: "texto 'Aceptar'" },
                { selector: SEL.btnAceptarByOK, name: "texto 'OK'" },
            ],
            "botón Aceptar del diálogo de éxito",
            { throwIfNotFound: false, pauseAfter: 500 }
        );

        log.warn("⚠ No se pudo encontrar el botón Aceptar, pero el FolioID ya fue extraído");
    } catch (error) {
        log.warn(`⚠ Error cerrando diálogo: ${(error as Error).message}`);
    }
}
