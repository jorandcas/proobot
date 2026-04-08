import { remote } from "webdriverio";
import type { Capabilities } from "@wdio/types";
import { ENV } from "./env";

export async function createDriver() {
    const opts: Capabilities.WebdriverIOConfig = {
        hostname: ENV.APPIUM_HOST,
        port: ENV.APPIUM_PORT,
        path: "/",
        capabilities: {
            platformName: "Android",
            "appium:automationName": "UiAutomator2",
            "appium:udid": ENV.DEVICE_UDID,
            "appium:deviceName": ENV.DEVICE_UDID,

            "appium:appPackage": "es.indra.pc.mobile.activity.temm",
            "appium:appActivity": "es.indra.pc.mobile.activity.temm.LoginActivityTEMM",

            "appium:noReset": true, // No reiniciar la app para mantener el estado
            "appium:newCommandTimeout": 120, // 120 segundos - tiempo suficiente para operaciones largas
            "appium:fullReset": false, // No desinstalar la app entre sesiones

            // Timeouts aumentados para cold start
            "appium:uiautomator2ServerLaunchTimeout": 180000,
            "appium:uiautomator2ServerInstallTimeout": 180000,
            "appium:adbExecTimeout": 180000,

            // Opciones adicionales para estabilidad
            "appium:ignoreUnimportantViews": true,
            "appium:disableWindowAnimation": true,
            "appium:skipServerInstallation": false, // Reinstalar servidor UiAutomator2

            // Espera implícita para esperas automáticas
            "appium:waitForIdleTimeout": 0, // Desactivar waitForIdle automático
        },
    };

    return remote(opts);
}
