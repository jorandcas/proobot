import type { Browser } from "webdriverio";
import { SEL, ENV, log, TIMEOUTS } from "@poc-login/config";
import {
    waitForWithRetry,
    safeClick,
    safeSetValue,
    waitForScreenStable,
} from "@poc-login/core";

export async function fillBusquedaPortForm(driver: Browser) {
    try {
        log.step("📝 Llenando formulario de búsqueda Port sin DN");

        // 1. Ingresar DN
        if (!ENV.SEARCH_DN) {
            throw new Error("SEARCH_DN es obligatorio");
        }

        log.info("Ingresando DN...");
        await safeSetValue(
            driver,
            SEL.dnInput,
            ENV.SEARCH_DN,
            "campo DN",
            { timeout: TIMEOUTS.WAITS.LONG }
        );
        log.success(`✓ DN: ${ENV.SEARCH_DN}`);

        // Pequeña pausa para procesar los campos
        await driver.pause(TIMEOUTS.PAUSES.SHORT);

        // 4. Click en CONTINUAR
        log.info("Clic en botón CONTINUAR...");

        // Estrategia mejorada: Click más deliberado para asegurar que se procese
        const btnElement = await driver.$(SEL.btnContinuar);
        await btnElement.waitForDisplayed({ timeout: TIMEOUTS.WAITS.MEDIUM });

        // Verificar que el botón esté clickable
        await btnElement.waitForEnabled({ timeout: TIMEOUTS.WAITS.SHORT });

        // Hacer click de forma más física usando performActions (método recomendado para Appium)
        const location = await btnElement.getLocation();
        const size = await btnElement.getSize();

        // Calcular centro del botón
        const centerX = Math.floor(location.x + size.width / 2);
        const centerY = Math.floor(location.y + size.height / 2);

        log.info(`Haciendo click en centro del botón (${centerX}, ${centerY})...`);

        // Usar performActions para click más preciso (recomendado por WebDriverIO para Appium)
        await driver.performActions([
            {
                type: 'pointer',
                id: 'finger1',
                parameters: { pointerType: 'touch' },
                actions: [
                    { type: 'pointerMove', duration: 0, x: centerX, y: centerY },
                    { type: 'pointerDown', button: 0 },
                    { type: 'pause', duration: 100 },
                    { type: 'pointerUp', button: 0 }
                ]
            }
        ]);

        log.success("✓ Click físico en Continuar realizado");

        // Esperar más tiempo para que la consulta inicie correctamente
        log.info("⏳ Esperando que inicie la consulta de interconexión...");
        await driver.pause(TIMEOUTS.PAUSES.STABILITY);
        log.info("🔄 La consulta puede tardar hasta 30 segundos...");

    } catch (error) {
        log.error(`Error llenando formulario: ${(error as Error).message}`);
        throw error;
    }
}
