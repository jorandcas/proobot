import type { Browser } from "webdriverio";
import { SEL, ENV, log, TIMEOUTS } from "@poc-login/config";
import {
    safeClick,
    safeSetValue,
    waitForScreenStable,
} from "@poc-login/core";

/**
 * Sección 2: Datos Personales - Llenar formulario y continuar
 */
export async function seccionDatosPersonales(driver: Browser) {
    try {
        log.step("👤 Sección 2: Datos Personales");

        // 1. Nombre (primer nombre)
        if (ENV.DATOS_NOMBRE) {
            log.info("Ingresando Nombre...");
            await safeSetValue(
                driver,
                SEL.nombreText,
                ENV.DATOS_NOMBRE,
                "campo Nombre",
                { timeout: TIMEOUTS.WAITS.LONG }
            );
            log.success(`✓ Nombre: ${ENV.DATOS_NOMBRE}`);
        }

        // 2. Nombre Segundo (segundos nombres)
        if (ENV.DATOS_NOMBRE_SEGUNDO) {
            log.info("Ingresando Nombre Segundo...");
            await safeSetValue(
                driver,
                SEL.nombreSecondText,
                ENV.DATOS_NOMBRE_SEGUNDO,
                "campo Nombre Segundo",
                { timeout: TIMEOUTS.WAITS.SHORT }
            );
            log.success(`✓ Nombre Segundo: ${ENV.DATOS_NOMBRE_SEGUNDO}`);
        }

        // 3. Apellido Paterno
        if (ENV.DATOS_APELLIDO_PATERNO) {
            log.info("Ingresando Apellido Paterno...");
            await safeSetValue(
                driver,
                SEL.surnameText,
                ENV.DATOS_APELLIDO_PATERNO,
                "campo Apellido Paterno",
                { timeout: TIMEOUTS.WAITS.SHORT }
            );
            log.success(`✓ Apellido Paterno: ${ENV.DATOS_APELLIDO_PATERNO}`);
        }

        // 4. Apellido Materno
        if (ENV.DATOS_APELLIDO_MATERNO) {
            log.info("Ingresando Apellido Materno...");
            await safeSetValue(
                driver,
                SEL.surnameSecondText,
                ENV.DATOS_APELLIDO_MATERNO,
                "campo Apellido Materno",
                { timeout: TIMEOUTS.WAITS.SHORT }
            );
            log.success(`✓ Apellido Materno: ${ENV.DATOS_APELLIDO_MATERNO}`);
        }

        // 5. CURP
        if (ENV.DATOS_CURP) {
            log.info("Ingresando CURP...");
            await safeSetValue(
                driver,
                SEL.curpText,
                ENV.DATOS_CURP,
                "campo CURP",
                { timeout: TIMEOUTS.WAITS.SHORT }
            );
            log.success(`✓ CURP: ${ENV.DATOS_CURP}`);
        }

        // 6. Teléfono de Contacto
        if (ENV.DATOS_TELEFONO) {
            log.info("Ingresando Teléfono de Contacto...");
            await safeSetValue(
                driver,
                SEL.phoneText,
                ENV.DATOS_TELEFONO,
                "campo Teléfono",
                { timeout: TIMEOUTS.WAITS.SHORT }
            );
            log.success(`✓ Teléfono: ${ENV.DATOS_TELEFONO}`);
        }

        // 7. Teléfono de Contacto 2
        if (ENV.DATOS_TELEFONO_2) {
            log.info("Ingresando Teléfono de Contacto 2...");
            await safeSetValue(
                driver,
                SEL.phoneSecondText,
                ENV.DATOS_TELEFONO_2,
                "campo Teléfono 2",
                { timeout: TIMEOUTS.WAITS.SHORT }
            );
            log.success(`✓ Teléfono 2: ${ENV.DATOS_TELEFONO_2}`);
        }

        // 8. Género (spinner)
        log.info("Seleccionando Género...");
        await safeClick(
            driver,
            SEL.generoSpinner,
            "spinner Género",
            { timeout: 15000 }
        );
        await driver.pause(TIMEOUTS.PAUSES.MEDIUM);

        const generoSelector = ENV.DATOS_GENERO === "Femenino"
            ? SEL.generoFemenino
            : SEL.generoMasculino;

        await safeClick(
            driver,
            generoSelector,
            `opción ${ENV.DATOS_GENERO}`,
            { timeout: 5000 }
        );
        log.success(`✓ Género: ${ENV.DATOS_GENERO}`);

        // 9. Email (opcional)
        if (ENV.DATOS_EMAIL) {
            log.info("Ingresando Email...");
            await safeSetValue(
                driver,
                SEL.personalEmailText,
                ENV.DATOS_EMAIL,
                "campo Email",
                { timeout: TIMEOUTS.WAITS.SHORT }
            );
            log.success(`✓ Email: ${ENV.DATOS_EMAIL}`);
        } else {
            log.info("Email no proporcionado, omitiendo...");
        }

        // 10. Fecha de Nacimiento (opcional)
        if (ENV.DATOS_FECHA_NACIMIENTO) {
            log.info("Ingresando Fecha de Nacimiento...");
            await safeSetValue(
                driver,
                SEL.birthDateText,
                ENV.DATOS_FECHA_NACIMIENTO,
                "campo Fecha de Nacimiento",
                { timeout: TIMEOUTS.WAITS.SHORT }
            );
            log.success(`✓ Fecha de Nacimiento: ${ENV.DATOS_FECHA_NACIMIENTO}`);
        } else {
            log.info("Fecha de Nacimiento no proporcionada, omitiendo...");
        }

        // Pequeña pausa para procesar
        await driver.pause(TIMEOUTS.PAUSES.MEDIUM);

        // 11. Click en SIGUIENTE
        log.info("Haciendo click en SIGUIENTE...");
        await safeClick(
            driver,
            SEL.btnSiguiente2,
            "botón SIGUIENTE",
            { timeout: 15000 }
        );
        log.success("✓ Click en SIGUIENTE realizado");

        // Esperar a que cargue la siguiente sección
        log.info("Esperando siguiente sección...");
        await waitForScreenStable(driver, 1500, 500, 20000);
        log.success("✓ Sección Datos Personales completada");

    } catch (error) {
        log.error(`Error en sección Datos Personales: ${(error as Error).message}`);
        throw error;
    }
}
