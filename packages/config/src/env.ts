import "dotenv/config";

function mustGet(name: string): string {
    const v = process.env[name];
    if (!v || !v.trim()) throw new Error(`Falta variable de entorno: ${name}`);
    return v.trim();
}

export const ENV = {
    TEMM_USER: mustGet("TEMM_USER"),
    TEMM_PASS: mustGet("TEMM_PASS"),
    DEVICE_UDID: mustGet("DEVICE_UDID"),
    APPIUM_HOST: (process.env.APPIUM_HOST || "127.0.0.1").trim(),
    APPIUM_PORT: Number(process.env.APPIUM_PORT || "4723"),

    // Campos de búsqueda (opcional)
    SEARCH_DN: (process.env.SEARCH_DN || "").trim(),

    // ICC (ahora obligatorio)
    ICC: (process.env.ICC || "").trim(),

    // NIP para sección Línea (obligatorio, exactamente 4 dígitos)
    LINEA_NIP: (process.env.LINEA_NIP || "").trim(),

    // FVC - Fecha específica a seleccionar (formato dd/mm/yyyy)
    FVC_FECHA: (process.env.FVC_FECHA || "").trim(),

    // Datos Personales (sección 2)
    DATOS_NOMBRE: (process.env.DATOS_NOMBRE || "").trim(),
    DATOS_NOMBRE_SEGUNDO: (process.env.DATOS_NOMBRE_SEGUNDO || "").trim(),
    DATOS_APELLIDO_PATERNO: (process.env.DATOS_APELLIDO_PATERNO || "").trim(),
    DATOS_APELLIDO_MATERNO: (process.env.DATOS_APELLIDO_MATERNO || "").trim(),
    DATOS_CURP: (process.env.DATOS_CURP || "").trim(),
    DATOS_TELEFONO: (process.env.DATOS_TELEFONO || "").trim(),
    DATOS_TELEFONO_2: (process.env.DATOS_TELEFONO_2 || "").trim(),
    DATOS_GENERO: (process.env.DATOS_GENERO || "Masculino").trim(), // Masculino o Femenino
    DATOS_EMAIL: (process.env.DATOS_EMAIL || "").trim(),
    DATOS_FECHA_NACIMIENTO: (process.env.DATOS_FECHA_NACIMIENTO || "").trim(),

    // Modo verbose (muestra más logs)
    VERBOSE: process.env.VERBOSE === "true",
} as const;

// Funciones de log mejoradas
export const log = {
    step: (msg: string) => console.log(`\n📍 ${msg}`),
    success: (msg: string) => console.log(`✅ ${msg}`),
    info: (msg: string) => {
        if (ENV.VERBOSE) console.log(`ℹ️  ${msg}`);
    },
    error: (msg: string) => console.error(`❌ ${msg}`),
    warn: (msg: string) => console.warn(`⚠️  ${msg}`),
};
