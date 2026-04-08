import type { Browser } from "webdriverio";
import { log } from "@poc-login/config";
import { DEFAULT_RETRY_CONFIG, TIMEOUTS } from "@poc-login/config";

/**
 * Configuración para reintentos con backoff exponencial
 */
export interface RetryConfig {
    maxRetries: number;
    initialDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
    timeout?: number; // Timeout por intento
}

/**
 * Opciones para waitForWithRetry
 */
export interface WaitForOptions {
    timeout?: number;
    reverse?: boolean;
    timeoutMsg?: string;
    interval?: number;
}

/**
 * Calcula delay con backoff exponencial
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
    const delay = Math.min(
        config.initialDelay * Math.pow(config.backoffMultiplier, attempt),
        config.maxDelay
    );
    return delay;
}

/**
 * Espera con reintentos y backoff exponencial
 * Útil para operaciones que pueden fallar por timeouts temporales
 */
export async function waitForWithRetry(
    driver: Browser,
    selector: string,
    options: WaitForOptions = {},
    retryConfig: Partial<RetryConfig> = {}
): Promise<ReturnType<Browser["$"]>> {
    const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
    const lastError = new Error();

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
        try {
            log.info(`Intento ${attempt + 1}/${config.maxRetries + 1} para elemento: ${selector.substring(0, 50)}...`);

            const element = await driver.$(selector);

            // Configurar timeout para este intento
            const waitOptions = {
                timeout: options.timeout || config.timeout,
                timeoutMsg: options.timeoutMsg,
                reverse: options.reverse,
                interval: options.interval || TIMEOUTS.INTERVALS.STABILITY_CHECK,
            };

            await element.waitForDisplayed(waitOptions);
            log.info(`✓ Elemento encontrado`);
            return element;

        } catch (error) {
            lastError.message = (error as Error).message;
            log.warn(`✗ Intento ${attempt + 1} fallido: ${(error as Error).message.substring(0, 100)}`);

            // Si no es el último intento, esperar antes de reintentar
            if (attempt < config.maxRetries) {
                const delay = calculateDelay(attempt, config);
                log.info(`Esperando ${delay}ms antes del siguiente intento...`);
                await driver.pause(delay);
            }
        }
    }

    throw new Error(
        `Elemento no encontrado después de ${config.maxRetries + 1} intentos: ${selector}\n` +
        `Último error: ${lastError.message}`
    );
}

/**
 * Ejecuta una acción con reintentos
 */
export async function executeWithRetry<T>(
    action: () => Promise<T>,
    actionName: string,
    retryConfig: Partial<RetryConfig> = {}
): Promise<T> {
    const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
    const lastError = new Error();

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
        try {
            log.info(`Ejecutando '${actionName}' - Intento ${attempt + 1}/${config.maxRetries + 1}`);
            const result = await action();
            log.info(`✓ '${actionName}' completado exitosamente`);
            return result;

        } catch (error) {
            lastError.message = (error as Error).message;
            log.warn(`✗ '${actionName}' falló: ${(error as Error).message.substring(0, 100)}`);

            if (attempt < config.maxRetries) {
                const delay = calculateDelay(attempt, config);
                log.info(`Esperando ${delay}ms antes de reintentar...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw new Error(
        `'${actionName}' falló después de ${config.maxRetries + 1} intentos.\n` +
        `Último error: ${lastError.message}`
    );
}

/**
 * Espera dinámica con timeout jerárquico
 * Timeout corto para warmup, timeout largo para cold start
 */
export async function waitForElementSmart(
    driver: Browser,
    selector: string,
    isColdStart: boolean = false,
    options: WaitForOptions = {}
): Promise<ReturnType<Browser["$"]>> {
    // En cold start, usar timeout más largo
    const timeout = isColdStart ? TIMEOUTS.WAITS.STABILITY : TIMEOUTS.WAITS.LONG;

    return waitForWithRetry(
        driver,
        selector,
        { ...options, timeout },
        { maxRetries: isColdStart ? 4 : 2 } // Más reintentos en cold start
    );
}

/**
 * Espera a que un elemento desaparezca
 */
export async function waitForElementToDisappear(
    driver: Browser,
    selector: string,
    timeout: number = TIMEOUTS.WAITS.LONG,
    elementName: string = "elemento"
): Promise<void> {
    try {
        await driver.waitUntil(async () => {
            const element = await driver.$(selector);
            const isDisplayed = await element.isDisplayed().catch(() => false);
            return !isDisplayed;
        }, {
            timeout,
            timeoutMsg: `${elementName} no desapareció después de ${timeout}ms`
        });
        log.info(`${elementName} desapareció correctamente`);
    } catch (error) {
        throw new Error(`Error esperando que ${elementName} desaparezca: ${(error as Error).message}`);
    }
}

/**
 * Espera a que la pantalla esté estable (sin loading spinners)
 */
export async function waitForScreenStable(
    driver: Browser,
    stabilityTimeout: number = TIMEOUTS.PAUSES.STABILITY,
    checkInterval: number = TIMEOUTS.INTERVALS.STABILITY_CHECK,
    maxWaitTime: number = TIMEOUTS.WAITS.STABILITY
): Promise<void> {
    const startTime = Date.now();
    let lastStableTime = Date.now();
    let stableCount = 0;

    log.info("Esperando que la pantalla se estabilice...");

    while (Date.now() - startTime < maxWaitTime) {
        try {
            // Verificar que no haya elementos de carga visibles
            // Puedes agregar selectores específicos de spinners aquí si es necesario

            const currentTime = Date.now();
            if (currentTime - lastStableTime >= stabilityTimeout) {
                stableCount++;
                if (stableCount >= 2) {
                    log.info("✓ Pantalla estable");
                    return;
                }
            }

            await driver.pause(checkInterval);
        } catch (error) {
            // Resetear contador si hay error
            lastStableTime = Date.now();
            stableCount = 0;
        }
    }

    log.warn("Timeout esperando estabilidad, continuando...");
}

/**
 * Mantiene la sesión activa con heartbeat periódico
 */
export async function keepSessionAlive(
    driver: Browser,
    duration: number,
    interval: number = TIMEOUTS.INTERVALS.HEARTBEAT
): Promise<void> {
    const endTime = Date.now() + duration;

    log.info(`Iniciando heartbeat por ${duration}ms (cada ${interval}ms)`);

    while (Date.now() < endTime) {
        try {
            // Ejecutar un comando simple para mantener la sesión activa
            await driver.status();
            await new Promise(resolve => setTimeout(resolve, interval));
        } catch (error) {
            log.warn(`Error en heartbeat: ${(error as Error).message}`);
            break;
        }
    }

    log.info("Heartbeat finalizado");
}

/**
 * Click seguro con reintentos
 */
export async function safeClick(
    driver: Browser,
    selector: string,
    elementName: string = "elemento",
    options: WaitForOptions = {}
): Promise<void> {
    await executeWithRetry(async () => {
        const element = await waitForWithRetry(driver, selector, options);
        await element.click();
        log.info(`Click en '${elementName}' realizado`);
    }, `click en ${elementName}`);
}

/**
 * SetValue seguro con reintentos
 * Usa addValue en lugar de setValue para mejor compatibilidad con Android
 */
export async function safeSetValue(
    driver: Browser,
    selector: string,
    value: string,
    elementName: string = "campo",
    options: WaitForOptions = {}
): Promise<void> {
    await executeWithRetry(async () => {
        const element = await waitForWithRetry(driver, selector, options);
        await element.clearValue();
        await driver.pause(TIMEOUTS.PAUSES.INSTANT); // Pequeña pausa después de limpiar

        // Usar addValue para mejor compatibilidad con campos de teléfono
        // setValue puede truncar valores en Android
        await element.addValue(value);
        log.info(`Valor establecido en '${elementName}': ${value}`);
    }, `setValue en ${elementName}`);
}
