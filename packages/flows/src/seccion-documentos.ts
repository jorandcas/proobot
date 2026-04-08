import type { Browser } from "webdriverio";
import { SEL, log, TIMEOUTS } from "@poc-login/config";
import {
    safeClick,
    waitForScreenStable,
} from "@poc-login/core";

/**
 * Sección 3: Documentos - Solo dar click en SIGUIENTE
 * Si se agregó el CURP en el paso anterior, esta sección solo requiere confirmar
 */
export async function seccionDocumentos(driver: Browser) {
    try {
        log.step("📄 Sección 3: Documentos");

        log.info("Verificando sección de Documentos...");
        await waitForScreenStable(driver, TIMEOUTS.PAUSES.EXTRA_LONG, TIMEOUTS.INTERVALS.STABILITY_CHECK, TIMEOUTS.WAITS.LONG);

        // Click en SIGUIENTE para pasar a la siguiente sección
        log.info("Haciendo click en SIGUIENTE...");
        await safeClick(
            driver,
            SEL.btnSiguiente2,
            "botón SIGUIENTE",
            { timeout: TIMEOUTS.WAITS.LONG }
        );
        log.success("✓ Click en SIGUIENTE realizado");

        // Esperar a que cargue la siguiente sección
        log.info("Esperando siguiente sección...");
        await waitForScreenStable(driver, TIMEOUTS.PAUSES.EXTRA_LONG, TIMEOUTS.INTERVALS.STABILITY_CHECK, TIMEOUTS.WAITS.EXTRA_LONG);
        log.success("✓ Sección Documentos completada");

    } catch (error) {
        log.error(`Error en sección Documentos: ${(error as Error).message}`);
        throw error;
    }
}
