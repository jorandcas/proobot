import type { Browser } from "webdriverio";
import { log } from "@poc-login/config";

/**
 * Estrategia para encontrar un elemento UI
 */
export interface SelectorStrategy {
    selector: string;
    name: string;
}

/**
 * Opciones para findAndClickButton
 */
export interface FindAndClickOptions {
    timeout?: number;
    pauseAfter?: number;
    throwIfNotFound?: boolean;
}

/**
 * Busca y hace click en un botón usando múltiples estrategias de selector
 *
 * @param driver - Instancia del driver de WebDriverIO
 * @param strategies - Array de estrategias de selector a intentar en orden
 * @param elementName - Nombre descriptivo del elemento para logging
 * @param options - Opciones opcionales
 * @returns Promise<void>
 */
export async function findAndClickButton(
    driver: Browser,
    strategies: SelectorStrategy[],
    elementName: string,
    options: FindAndClickOptions = {}
): Promise<void> {
    const {
        timeout = 5000,
        pauseAfter = 500,
        throwIfNotFound = true,
    } = options;

    log.info(`Buscando ${elementName} con ${strategies.length} estrategias...`);

    for (const { selector, name } of strategies) {
        try {
            const element = await driver.$(selector);

            // Esperar a que el elemento esté visible
            await element.waitForDisplayed({ timeout });

            // Hacer click
            await element.click();

            log.info(`✓ ${elementName} encontrado por ${name}`);
            log.success(`✓ Click en ${elementName} realizado`);

            // Pausa opcional después del click (útil para modales)
            if (pauseAfter > 0) {
                await driver.pause(pauseAfter);
            }

            return;
        } catch (e) {
            log.info(`✗ Estrategia "${name}" falló, intentando siguiente...`);
        }
    }

    // Si llegamos aquí, ninguna estrategia funcionó
    const errorMsg = `No se pudo encontrar ${elementName} después de ${strategies.length} estrategias`;

    if (throwIfNotFound) {
        throw new Error(errorMsg);
    } else {
        log.warn(`⚠️ ${errorMsg}`);
    }
}

/**
 * Busca un elemento usando múltiples estrategias sin hacer click
 *
 * @param driver - Instancia del driver de WebDriverIO
 * @param strategies - Array de estrategias de selector a intentar en orden
 * @param elementName - Nombre descriptivo del elemento para logging
 * @param options - Opciones opcionales
 * @returns El elemento encontrado o null si no se encontró
 */
export async function findElement(
    driver: Browser,
    strategies: SelectorStrategy[],
    elementName: string,
    options: FindAndClickOptions = {}
): Promise<ReturnType<Browser["$"]> | null> {
    const { timeout = 5000, throwIfNotFound = false } = options;

    log.info(`Buscando ${elementName} con ${strategies.length} estrategias...`);

    for (const { selector, name } of strategies) {
        try {
            const element = await driver.$(selector);

            // Esperar a que el elemento esté visible
            await element.waitForDisplayed({ timeout });

            log.info(`✓ ${elementName} encontrado por ${name}`);
            return element;
        } catch (e) {
            log.info(`✗ Estrategia "${name}" falló, intentando siguiente...`);
        }
    }

    // Si llegamos aquí, ninguna estrategia funcionó
    const errorMsg = `No se pudo encontrar ${elementName} después de ${strategies.length} estrategias`;

    if (throwIfNotFound) {
        throw new Error(errorMsg);
    } else {
        log.warn(`⚠️ ${errorMsg}`);
        return null;
    }
}

/**
 * Ejecuta múltiples estrategias hasta que una tenga éxito
 *
 * @param strategies - Array de funciones async a intentar en orden
 * @param description - Descripción de la operación para logging
 * @returns El resultado de la primera estrategia exitosa
 * @throws Error si ninguna estrategia tiene éxito
 */
export async function tryMultipleStrategies<T>(
    strategies: Array<() => Promise<T>>,
    description: string
): Promise<T> {
    log.info(`Intentando ${strategies.length} estrategias para: ${description}`);

    for (let i = 0; i < strategies.length; i++) {
        try {
            log.info(`Estrategia ${i + 1}/${strategies.length}...`);
            const result = await strategies[i]();
            log.success(`✓ Estrategia ${i + 1} exitosa`);
            return result;
        } catch (e) {
            log.warn(`✗ Estrategia ${i + 1} falló: ${(e as Error).message}`);
        }
    }

    throw new Error(`Todas las ${strategies.length} estrategias fallaron para: ${description}`);
}
