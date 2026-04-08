import type { Browser } from "webdriverio";
import { SEL, ENV, log, TIMEOUTS } from "@poc-login/config";
import {
    waitForWithRetry,
    safeClick,
    safeSetValue,
    waitForScreenStable,
} from "@poc-login/core";

/**
 * Paso 5: Bloqueo ICC
 * Llena el campo ICC (si está configurado) y hace click en BLOQUEAR ICC
 */
export async function bloquearICC(driver: Browser) {
    try {
        log.step("🔒 Procesando bloqueo ICC");

        // Esperar que cargue la pantalla de bloqueo ICC
        log.info("Esperando pantalla de bloqueo ICC...");
        await waitForScreenStable(driver, TIMEOUTS.PAUSES.EXTRA_LONG, TIMEOUTS.INTERVALS.STABILITY_CHECK, TIMEOUTS.WAITS.LONG);
        log.info("✓ Pantalla cargada");

        // Ingresar ICC (opcional)
        if (ENV.ICC) {
            log.info("Ingresando ICC...");
            await safeSetValue(
                driver,
                SEL.iccInput,
                ENV.ICC,
                "campo ICC",
                { timeout: TIMEOUTS.WAITS.LONG }
            );
            log.success(`✓ ICC ingresado: ${ENV.ICC}`);
        } else {
            log.info("ICC no configurado, dejando vacío");
        }

        // Click en BLOQUEAR ICC
        log.info("Clic en botón BLOQUEAR ICC...");
        await safeClick(
            driver,
            SEL.btnBloquearICC,
            "botón BLOQUEAR ICC",
            { timeout: TIMEOUTS.WAITS.LONG }
        );
        log.success("✓ Click en BLOQUEAR ICC realizado");

        // Esperar a que se complete la acción
        log.info("Esperando confirmación...");
        await waitForScreenStable(driver, TIMEOUTS.PAUSES.STABILITY, TIMEOUTS.INTERVALS.STABILITY_CHECK, TIMEOUTS.WAITS.EXTRA_LONG);
        log.success("✓ Acción completada");

    } catch (error) {
        log.error(`Error en bloqueo ICC: ${(error as Error).message}`);
        throw error;
    }
}
