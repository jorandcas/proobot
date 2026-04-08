import { createDriver, log, ENV } from "@poc-login/config";
import { login } from "@poc-login/flows";
import { navigateToPortSinDnTransito } from "@poc-login/flows";
import { fillBusquedaPortForm } from "@poc-login/flows";
import { handleInterconexionModal } from "@poc-login/flows";
import { bloquearICC } from "@poc-login/flows";
import { continuarTramite } from "@poc-login/flows";
import { seccionLinea } from "@poc-login/flows";
import { seccionDatosPersonales } from "@poc-login/flows";
import { seccionDocumentos } from "@poc-login/flows";
import { seccionEnvio } from "@poc-login/flows";

async function run() {
    const driver = await createDriver();

    try {
        log.success("Sesión iniciada");

        log.step("PASO 1: Login");
        // Primer login con isColdStart=true para timeouts más largos
        await login(driver, true);

        log.step("PASO 2: Navegando a Porta SIN DN Transitorio");
        await navigateToPortSinDnTransito(driver);

        log.step("PASO 3: Llenando formulario de búsqueda");
        await fillBusquedaPortForm(driver);

        log.step("PASO 4: Procesando resultado de interconexión");
        await handleInterconexionModal(driver);

        log.step("PASO 5: Bloqueo ICC");
        await bloquearICC(driver);

        log.step("PASO 6: Continuar Trámite");
        await continuarTramite(driver);

        log.step("PASO 7: Sección 1 - Línea");
        await seccionLinea(driver, ENV.LINEA_NIP, ENV.FVC_FECHA);

        log.step("PASO 8: Sección 2 - Datos Personales");
        await seccionDatosPersonales(driver);

        log.step("PASO 9: Sección 3 - Documentos");
        await seccionDocumentos(driver);

        log.step("PASO 10: Sección 4 - Envío");
        const envioResult = await seccionEnvio(driver);

        // Validar que se detectó el FolioID
        if (!envioResult.success) {
            log.error(`❌ Error: ${envioResult.message}`);

            // Si hay un mensaje de error específico del APK, mostrarlo
            if (envioResult.errorMessage) {
                log.error(`❌ Mensaje del APK: ${envioResult.errorMessage}`);
                log.error(`❌ Es error de datos: ${envioResult.isDataError ? 'SÍ' : 'NO'}`);

                // Lanzar error con el mensaje específico para que el backend lo capture
                throw new Error(envioResult.errorMessage);
            }

            log.error("❌ El trámite NO pudo completarse exitosamente - No se detectó el FolioID");
            throw new Error(envioResult.message);
        }

        log.success(`\n🎉 Flujo completado exitosamente`);
        log.success(`📋 FolioID del trámite: ${envioResult.folioId}`);
    } catch (err) {
        log.error(`Error: ${err}`);
        process.exit(1); // Terminar con código de error
    } finally {
        await driver.deleteSession();
        console.log("\n🔒 Sesión cerrada");
    }
}

run();
