/**
 * Configuración centralizada de timeouts y pauses
 *
 * Todos los tiempos están en milisegundos (ms)
 *
 * @example
 * ```typescript
 * await driver.pause(TIMEOUTS.PAUSES.SHORT);
 * await element.waitForDisplayed({ timeout: TIMEOUTS.WAIT.MEDIUM });
 * ```
 */

/**
 * Timeouts para pausas (driver.pause)
 */
export const PAUSES = {
    /** Pausa instantánea para limpieza de campos */
    INSTANT: 100,

    /** Pausa corta para transiciones rápidas */
    SHORT: 300,

    /** Pausa media para actualización de UI */
    MEDIUM: 500,

    /** Pausa larga para despliegue de listas/spinners */
    LONG: 800,

    /** Pausa extra para modales y diálogos */
    EXTRA_LONG: 1000,

    /** Pausa para estabilidad de pantalla */
    STABILITY: 2000,

    /** Pausa para debugging */
    DEBUG: 3000,

    /** Pausa para operaciones manuales/lentas */
    MANUAL: 10000,
} as const;

/**
 * Timeouts para esperar elementos (waitForDisplayed, waitForEnabled, etc)
 */
export const WAITS = {
    /** Timeout corto para elementos inmediatos */
    SHORT: 5000,

    /** Timeout medio para elementos típicos */
    MEDIUM: 10000,

    /** Timeout largo para elementos lentos */
    LONG: 15000,

    /** Timeout extra largo para operaciones complejas */
    EXTRA_LONG: 25000,

    /** Timeout para estabilidad de pantalla */
    STABILITY: 30000,
} as const;

/**
 * Timeout por defecto para reintentos
 */
export const RETRY = {
    /** Timeout por intento en operaciones con retry */
    TIMEOUT: 15000,

    /** Delay inicial entre reintentos */
    INITIAL_DELAY: 1000,

    /** Delay máximo entre reintentos */
    MAX_DELAY: 10000,

    /** Máximo número de reintentos */
    MAX_RETRIES: 3,

    /** Multiplicador para backoff exponencial */
    BACKOFF_MULTIPLIER: 2,
} as const;

/**
 * Tiempo de espera para modales y diálogos
 */
export const MODALS = {
    /** Intervalo de verificación para modales */
    CHECK_INTERVAL: 500,

    /** Tiempo máximo de espera para modal de interconexión (2 minutos) */
    MAX_WAIT: 120000,

    /** Pausa después de cerrar modal */
    AFTER_CLOSE: 500,
} as const;

/**
 * Intervalos para verificaciones periódicas
 */
export const INTERVALS = {
    /** Intervalo de verificación de estabilidad */
    STABILITY_CHECK: 500,

    /** Intervalo de heartbeat */
    HEARTBEAT: 5000,
} as const;

/**
 * Objeto unificado con todos los timeouts
 * Útil para importar todo en una línea: import { TIMEOUTS } from './timeouts'
 */
export const TIMEOUTS = {
    PAUSES,
    WAITS,
    RETRY,
    MODALS,
    INTERVALS,
} as const;

/**
 * Valores por defecto para funciones de retry
 */
export const DEFAULT_RETRY_CONFIG = {
    maxRetries: RETRY.MAX_RETRIES,
    initialDelay: RETRY.INITIAL_DELAY,
    maxDelay: RETRY.MAX_DELAY,
    backoffMultiplier: RETRY.BACKOFF_MULTIPLIER,
    timeout: RETRY.TIMEOUT,
} as const;
