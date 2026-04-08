import type { Browser } from "webdriverio";
import { SEL, log, TIMEOUTS } from "@poc-login/config";
import {
    waitForWithRetry,
    safeClick,
} from "@poc-login/core";
import { findAndClickButton } from "@poc-login/core";

export interface InterconexionResult {
    hasTraffic: boolean;
    message: string;
}

export async function handleInterconexionModal(driver: Browser): Promise<InterconexionResult> {
    try {
        log.step("🔔 Procesando modal de interconexión");

        // Estrategia: esperar a que aparezca CUALQUIER botón de modal
        // Esto es más confiable que esperar el mensaje de texto
        log.info("Esperando que aparezca el modal (buscando botón Aceptar)...");

        let modalFound = false;
        let dialogMessage: ReturnType<Browser["$"]> | null = null;
        let messageText = "";

        // Esperar al modal con más paciencia - puede tardar hasta 2 minutos
        // El modal aparece cuando termina la consulta de interconexión
        const maxAttempts = Math.ceil(TIMEOUTS.MODALS.MAX_WAIT / TIMEOUTS.MODALS.CHECK_INTERVAL);
        const waitMs = TIMEOUTS.MODALS.CHECK_INTERVAL;

        log.info(`Esperando modal (tiempo máximo: ${maxAttempts * waitMs / 1000}s)...`);

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            // Cada 2 segundos (cada 4 intentos), mostrar progreso
            if (attempt % 4 === 1) {
                log.info(`⏳ Esperando modal... (${attempt * waitMs / 1000}s / ${maxAttempts * waitMs / 1000}s)`);
            }

            // Buscar cualquier señal del modal: botón Aceptar o mensaje
            try {
                // Primero buscar el botón Aceptar (es lo más confiable)
                const btnTry1 = await driver.$(SEL.btnAceptar).isDisplayed().catch(() => false);
                const btnTry2 = await driver.$(SEL.btnAceptarByText).isDisplayed().catch(() => false);
                const btnTry3 = await driver.$(SEL.btnAceptarByOK).isDisplayed().catch(() => false);

                if (btnTry1 || btnTry2 || btnTry3) {
                    log.success(`✓ Modal detectado después de ${attempt * waitMs / 1000}s`);
                    modalFound = true;
                    break;
                }

                // También verificar el mensaje de diálogo
                const msg = await driver.$(SEL.dialogMessage);
                if (await msg.isDisplayed().catch(() => false)) {
                    dialogMessage = msg;
                    messageText = await msg.getText();
                    log.success(`✓ Modal detectado después de ${attempt * waitMs / 1000}s`);
                    modalFound = true;
                    break;
                }

            } catch (e) {
                // Continuar intentando
            }

            // Esperar entre intentos
            await driver.pause(waitMs);
        }

        if (!modalFound) {
            throw new Error(`Modal no apareció después de ${maxAttempts * waitMs / 1000} segundos`);
        }

        // Extraer mensaje si lo encontramos
        let hasTraffic = false;

        if (dialogMessage) {
            messageText = await dialogMessage.getText();
            hasTraffic = messageText.toUpperCase().includes("SI HA TENIDO");
            log.info(`Resultado: ${hasTraffic ? "SÍ" : "NO"} ha tenido tráfico de interconexión`);
            console.log(`📝 ${messageText}`);
        } else {
            log.info("No se pudo extraer el mensaje del modal, continuando...");
        }

        // Buscar y hacer click en el botón Aceptar
        await findAndClickButton(
            driver,
            [
                { selector: SEL.btnAceptar, name: "ID android:id/button1" },
                { selector: SEL.btnAceptarByText, name: "texto 'Aceptar'" },
                { selector: SEL.btnAceptarByOK, name: "texto 'OK'" },
            ],
            "botón Aceptar",
            { pauseAfter: 500 }
        );

        log.success("✓ Modal procesado exitosamente");

        return {
            hasTraffic,
            message: messageText
        };

    } catch (error) {
        log.error(`Error en modal: ${(error as Error).message}`);
        throw error;
    }
}
