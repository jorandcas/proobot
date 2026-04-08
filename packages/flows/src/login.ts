import type { Browser } from "webdriverio";
import { SEL, ENV, log, TIMEOUTS } from "@poc-login/config";
import {
    waitForElementSmart,
    safeClick,
    safeSetValue,
    waitForElementToDisappear,
    waitForScreenStable,
} from "@poc-login/core";

export async function login(driver: Browser, isColdStart: boolean = true) {
    try {
        log.step("🔐 Iniciando proceso de login...");

        // Esperar a que la pantalla de login esté completamente cargada
        log.info("Esperando pantalla de login...");
        const testElement = await waitForElementSmart(
            driver,
            SEL.user,
            isColdStart,
            { timeoutMsg: "Pantalla de login no detectada" }
        );
        log.info("✓ Pantalla de login detectada");

        // 1) Cambiar dominio a Local
        log.info("Cambiando dominio a Local...");
        await safeClick(
            driver,
            SEL.spinnerDominio,
            "spinner de dominio",
            { timeout: TIMEOUTS.WAITS.MEDIUM }
        );

        await safeClick(
            driver,
            SEL.optionLocalByText,
            "opción Local",
            { timeout: TIMEOUTS.WAITS.SHORT }
        );
        log.success("✓ Dominio cambiado a Local");

        // Pequeña pausa para que la UI se actualice
        await driver.pause(TIMEOUTS.PAUSES.MEDIUM);

        // 2) Usuario
        log.info("Ingresando usuario...");
        await safeSetValue(
            driver,
            SEL.user,
            ENV.TEMM_USER,
            "campo usuario",
            { timeout: TIMEOUTS.WAITS.SHORT }
        );
        log.info(`✓ Usuario: ${ENV.TEMM_USER}`);

        // 3) Contraseña
        log.info("Ingresando contraseña...");
        await safeSetValue(
            driver,
            SEL.password,
            ENV.TEMM_PASS,
            "campo contraseña",
            { timeout: TIMEOUTS.WAITS.SHORT }
        );
        log.info("✓ Contraseña ingresada");

        // Pequeña pausa para que los campos se procesen
        await driver.pause(TIMEOUTS.PAUSES.SHORT);

        // 4) Acceder - click en botón OK
        log.info("Clic en botón Acceder...");
        const btn = await driver.$(SEL.btnOk);
        await btn.click();
        log.info("✓ Click en Acceder realizado");

        // 5) Esperar cambio de pantalla con timeout más largo para cold start
        log.info("Esperando cambio de pantalla...");
        const loginTimeout = isColdStart ? 30000 : 15000;
        await waitForElementToDisappear(
            driver,
            SEL.btnOk,
            loginTimeout,
            "botón de login"
        );

        // Esperar a que la pantalla esté completamente estable
        log.info("Verificando estabilidad de pantalla...");
        await waitForScreenStable(driver, 1500, 500, 20000);

        log.success("✓ Login completado exitosamente");

    } catch (error) {
        log.error(`Error en login: ${(error as Error).message}`);
        throw error;
    }
}
