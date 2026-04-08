import type { Browser } from "webdriverio";
import { SEL, log, TIMEOUTS } from "@poc-login/config";
import {
    waitForWithRetry,
    safeClick,
    waitForScreenStable,
} from "@poc-login/core";

/**
 * Paso 6: Continuar Trámite
 * Click en el botón CONTINUAR TRÁMITE después del bloqueo ICC
 */
export async function continuarTramite(driver: Browser) {
    try {
        log.step("🚀 Procesando continuación de trámite");

        // Esperar a que aparezca el botón CONTINUAR TRÁMITE
        log.info("Esperando botón CONTINUAR TRÁMITE...");
        const btnContinuar = await waitForWithRetry(
            driver,
            SEL.btnContinuarTramite,
            { timeout: TIMEOUTS.WAITS.EXTRA_LONG, timeoutMsg: "Botón CONTINUAR TRÁMITE no apareció" },
            { maxRetries: 4, initialDelay: TIMEOUTS.RETRY.INITIAL_DELAY + 500 }
        );
        log.info("✓ Botón CONTINUAR TRÁMITE detectado");

        // Click en el botón
        log.info("Clic en botón CONTINUAR TRÁMITE...");
        await btnContinuar.click();
        log.success("✓ Click en CONTINUAR TRÁMITE realizado");

        // Esperar a que se complete la acción
        log.info("Esperando confirmación...");
        await waitForScreenStable(driver, TIMEOUTS.PAUSES.EXTRA_LONG, TIMEOUTS.INTERVALS.STABILITY_CHECK, TIMEOUTS.WAITS.EXTRA_LONG);
        log.success("✓ Continuación de trámite completada");

    } catch (error) {
        log.error(`Error en continuar trámite: ${(error as Error).message}`);
        throw error;
    }
}
