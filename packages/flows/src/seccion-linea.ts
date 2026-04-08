import type { Browser } from "webdriverio";
import { SEL, ENV, log, TIMEOUTS } from "@poc-login/config";
import {
    waitForWithRetry,
    safeClick,
    safeSetValue,
    waitForScreenStable,
} from "@poc-login/core";
import { findAndClickButton, tryMultipleStrategies } from "@poc-login/core";

/**
 * Selecciona el plan comercial "ML - Prepago Rollover Portabilidad"
 */
async function seleccionarPlanComercial(driver: Browser) {
    try {
        log.info("Seleccionando plan comercial...");

        // Esperar un momento para que aparezca el spinner
        await driver.pause(TIMEOUTS.PAUSES.MEDIUM);

        // Buscar el spinner de plan comercial
        const spinner = await driver.$(SEL.commercialPlanSpinner);
        const existe = await spinner.isDisplayed().catch(() => false);

        if (!existe) {
            log.info("✓ No apareció spinner de plan comercial, continuando...");
            return;
        }

        // Obtener el texto actual del spinner para verificar si ya está seleccionado
        const textoSpinner = await spinner.getText();
        log.info(`Plan comercial actual: "${textoSpinner}"`);

        // Si ya muestra "ML - Prepago Rollover Portabilidad", ya está seleccionado
        if (textoSpinner.includes("ML - Prepago Rollover Portabilidad")) {
            log.success("✓ Plan comercial 'ML - Prepago Rollover Portabilidad' ya está seleccionado");
            return;
        }

        // Hacer click en el spinner para abrir las opciones
        log.info("Abriendo spinner de plan comercial...");
        await spinner.click();
        await driver.pause(TIMEOUTS.PAUSES.MEDIUM);

        // Buscar y seleccionar la opción
        log.info("Seleccionando opción 'ML - Prepago Rollover Portabilidad'...");
        const opcion = await driver.$(SEL.mlRolloverOption);
        await opcion.waitForDisplayed({ timeout: TIMEOUTS.WAITS.SHORT });
        await opcion.click();
        log.success("✓ Plan comercial 'ML - Prepago Rollover Portabilidad' seleccionado");

        await driver.pause(TIMEOUTS.PAUSES.MEDIUM);

    } catch (error) {
        log.warn(`⚠️ Error seleccionando plan comercial: ${(error as Error).message}`);
        // Continuar de todos modos
    }
}

/**
 * Selecciona la opción "ML - Prepago Rollover Portabilidad" si aparece el spinner
 */
async function seleccionarMLRollover(driver: Browser) {
    try {
        log.info("Verificando si aparece spinner ML - Prepago Rollover Portabilidad...");

        // Esperar un momento para que aparezca
        await driver.pause(TIMEOUTS.PAUSES.MEDIUM);

        // Buscar el spinner por el texto que muestra
        try {
            const spinner = await driver.$(SEL.mlRolloverSpinner);
            const existe = await spinner.isDisplayed().catch(() => false);

            if (!existe) {
                log.info("✓ No apareció spinner ML Rollover, continuando...");
                return;
            }

            // Obtener el texto actual del spinner para verificar si es el correcto
            const textoSpinner = await spinner.getText();
            log.info(`Spinner encontrado con texto: "${textoSpinner}"`);

            // Si ya muestra "ML - Prepago Rollover Portabilidad", ya está seleccionado
            if (textoSpinner.includes("ML - Prepago Rollover Portabilidad")) {
                log.success("✓ ML - Prepago Rollover Portabilidad ya está seleccionado");
                return;
            }

            // Hacer click en el spinner para abrir las opciones
            log.info("Abriendo spinner ML Rollover...");
            await spinner.click();
            await driver.pause(TIMEOUTS.PAUSES.EXTRA_LONG);

            // Buscar y seleccionar la opción
            log.info("Seleccionando opción 'ML - Prepago Rollover Portabilidad'...");
            const opcion = await driver.$(SEL.mlRolloverOption);
            await opcion.waitForDisplayed({ timeout: TIMEOUTS.WAITS.SHORT });
            await opcion.click();
            log.success("✓ ML - Prepago Rollover Portabilidad seleccionado");

            await driver.pause(TIMEOUTS.PAUSES.MEDIUM);

        } catch (e) {
            log.info("✓ No aparece el spinner ML Rollover, continuando...");
        }

    } catch (error) {
        log.warn(`⚠️ Error seleccionando ML Rollover: ${(error as Error).message}`);
        // Continuar de todos modos
    }
}

/**
 * Sección 1: Línea - Ingresar NIP, seleccionar FVC específica y continuar
 */
export async function seccionLinea(driver: Browser, nip?: string, fechaFVC?: string) {
    try {
        log.step("📅 Sección 1: Línea - NIP y FVC");

        // 1. Ingresar NIP
        const nipIngresar = nip || ENV.LINEA_NIP;

        if (nipIngresar) {
            log.info("Ingresando NIP...");
            await safeSetValue(
                driver,
                SEL.nipInput,
                nipIngresar,
                "campo NIP",
                { timeout: TIMEOUTS.WAITS.LONG }
            );
            log.success(`✓ NIP ingresado: ****`);
            await driver.pause(TIMEOUTS.PAUSES.MEDIUM);

            // Seleccionar Plan Comercial
            await seleccionarPlanComercial(driver);

            // Seleccionar ML - Prepago Rollover Portabilidad si aparece
            await seleccionarMLRollover(driver);
        } else {
            log.warn("⚠️ NIP no configurado, se omitirá este campo");
        }

        // 2. Seleccionar FVC - Fecha específica del formulario
        const fechaSeleccionada = fechaFVC || ENV.FVC_FECHA;

        if (!fechaSeleccionada) {
            throw new Error("No se proporcionó fecha FVC. La fecha es obligatoria.");
        }

        log.info(`Seleccionando FVC: ${fechaSeleccionada}`);

        // Hacer click en el spinner de FVC
        log.info("Haciendo click en spinner FVC...");
        await safeClick(
            driver,
            SEL.fvcSpinner,
            "spinner FVC",
            { timeout: TIMEOUTS.WAITS.LONG }
        );
        log.success("✓ Click en spinner realizado");

        // Esperar que se despliegue la lista de fechas
        await driver.pause(TIMEOUTS.PAUSES.LONG);

        // Esperar ListView
        log.info("Esperando ListView del spinner...");
        const listView = await driver.$("//android.widget.ListView");
        await listView.waitForDisplayed({ timeout: TIMEOUTS.WAITS.SHORT });
        log.success("✓ ListView encontrado");

        // Esperar un poco más para que se carguen las fechas
        await driver.pause(TIMEOUTS.PAUSES.MEDIUM);

        // Buscar y seleccionar la fecha específica con formato dd/mm/yyyy
        log.info(`Buscando fecha específica: ${fechaSeleccionada}`);
        const fechaRegex = /^\d{2}\/\d{2}\/\d{4}$/;
        let fechaEncontrada = false;

        // Estrategia 1: Buscar TextViews con formato de fecha
        const allTextViews = await driver.$$('//android.widget.TextView');
        log.info(`✓ Analizando ${allTextViews.length} TextViews...`);

        for (const elem of allTextViews) {
            try {
                const texto = await elem.getText();
                if (texto && fechaRegex.test(texto)) {
                    log.info(`Fecha encontrada: ${texto}`);

                    // Comparar con la fecha buscada
                    if (texto === fechaSeleccionada) {
                        await elem.click();
                        log.success(`✓ Fecha seleccionada: ${texto}`);
                        fechaEncontrada = true;
                        break;
                    }
                }
            } catch (e) {
                // Continuar con siguiente
            }
        }

        // Estrategia 2: Si no encontró en TextViews, buscar en CheckedTextViews (común en spinners)
        if (!fechaEncontrada) {
            log.info("Buscando en CheckedTextViews...");
            const allCheckedTextViews = await driver.$$('//android.widget.CheckedTextView');
            log.info(`✓ Analizando ${allCheckedTextViews.length} CheckedTextViews...`);

            for (const elem of allCheckedTextViews) {
                try {
                    const texto = await elem.getText();
                    if (texto && fechaRegex.test(texto)) {
                        log.info(`Fecha encontrada: ${texto}`);

                        // Comparar con la fecha buscada
                        if (texto === fechaSeleccionada) {
                            await elem.click();
                            log.success(`✓ Fecha seleccionada: ${texto}`);
                            fechaEncontrada = true;
                            break;
                        }
                    }
                } catch (e) {
                    // Continuar con siguiente
                }
            }
        }

        // Si no encontró la fecha específica, lanzar error
        if (!fechaEncontrada) {
            throw new Error(`No se encontró la fecha ${fechaSeleccionada} en el spinner. Verifica que la fecha esté disponible.`);
        }

        // Pequeña pausa para que se seleccione
        await driver.pause(TIMEOUTS.PAUSES.MEDIUM);

        // 3. Hacer click en SIGUIENTE para pasar a la siguiente sección
        log.info("Haciendo click en SIGUIENTE (múltiples estrategias)...");

        // Intentar múltiples estrategias para encontrar y clickar el botón SIGUIENTE
        try {
            await findAndClickButton(
                driver,
                [
                    { selector: SEL.btnSiguienteInTableRow, name: "TableRow (más específico)" },
                    { selector: SEL.btnSiguienteXPath, name: "XPath general" },
                    { selector: SEL.btnSiguienteByText, name: "UiSelector por texto" },
                ],
                "botón SIGUIENTE",
                { timeout: TIMEOUTS.WAITS.SHORT }
            );
        } catch (e) {
            // Fallback: Si ninguna estrategia funcionó, ir directo al tab de Datos Personales
            log.warn("⚠️ No se encontró botón SIGUIENTE, usando fallback directo a sección 2...");
            try {
                const tabDatosPersonales = await driver.$(SEL.tabDatosPersonalesLayout);
                await tabDatosPersonales.waitForDisplayed({ timeout: TIMEOUTS.WAITS.SHORT });
                await tabDatosPersonales.click();
                log.success("✓ Click directo en tab 'Datos Personales' realizado");
            } catch (e2) {
                throw new Error("No se pudo encontrar botón SIGUIENTE ni tab de Datos Personales");
            }
        }

        // Pequeña pausa para que cargue la siguiente sección
        await driver.pause(TIMEOUTS.PAUSES.EXTRA_LONG);

        // 4. Verificar que llegamos a la sección 2: Datos Personales
        log.info("Verificando que llegamos a la sección 2: Datos Personales...");
        try {
            const tabDatosPersonales = await driver.$(SEL.tabDatosPersonales);
            const esVisible = await tabDatosPersonales.isDisplayed().catch(() => false);

            if (esVisible) {
                const textoTab = await tabDatosPersonales.getText();
                log.success(`✓ Llegamos a: ${textoTab}`);
            } else {
                log.warn("⚠️ No se pudo confirmar la sección, pero continuando...");
            }
        } catch (e) {
            log.warn("⚠️ No se pudo verificar el tab de Datos Personales, pero continuando...");
        }

        log.success("✓ Sección Línea completada");

    } catch (error) {
        log.error(`Error en sección Línea: ${(error as Error).message}`);
        throw error;
    }
}
