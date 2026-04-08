import type { Browser } from "webdriverio";
import { SEL, log, TIMEOUTS } from "@poc-login/config";
import {
    waitForWithRetry,
    safeClick,
    waitForScreenStable,
} from "@poc-login/core";

export async function navigateToPortSinDnTransito(driver: Browser) {
    try {
        log.info("📍 Buscando opción 'Porta SIN DN Transitorio' en menú...");

        let menuOption: ReturnType<Browser["$"]> | null = null;

        // Intentar encontrar por texto primero
        try {
            menuOption = await waitForWithRetry(
                driver,
                SEL.menuPortaSinDnTransito,
                { timeout: TIMEOUTS.WAITS.LONG, timeoutMsg: "Opción de menú no encontrada (texto)" }
            );
            log.info("✓ Menú encontrado por texto");
        } catch {
            // Si falla, intentar por ID
            log.warn("Opción por texto no encontrada, intentando por ID...");
            menuOption = await waitForWithRetry(
                driver,
                SEL.menuPortaSinDnTransitoById,
                { timeout: TIMEOUTS.WAITS.LONG, timeoutMsg: "Opción de menú no encontrada (ID)" }
            );
            log.info("✓ Menú encontrado por ID");
        }

        // Click en la opción de menú
        log.info("Clic en opción de menú...");
        if (menuOption) {
            await menuOption.click();
            log.success("✓ Clic realizado");
        }

        // Esperar a que cargue el siguiente formulario
        log.info("Esperando que cargue el formulario...");
        await waitForScreenStable(driver, TIMEOUTS.PAUSES.EXTRA_LONG, TIMEOUTS.INTERVALS.STABILITY_CHECK, TIMEOUTS.WAITS.LONG);
        log.success("✓ Formulario cargado");

    } catch (error) {
        log.error(`Error navegando a Porta SIN DN Transitorio: ${(error as Error).message}`);
        throw error;
    }
}
