import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Crear directorio de logs si no existe
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Configurar niveles de log
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Definir colores para cada nivel
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Configurar formato de log
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Crear logger (sin transporte de consola para evitar mezcla con TUI)
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format,
  transports: [
    // File transport - todos los logs
    new winston.transports.File({
      filename: path.join(logsDir, 'worker.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    // File transport - solo errores
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
  ],
});

// Hook para redirigir logs a la TUI cuando esté disponible
let tuiLogCallback: ((level: string, message: string) => void) | null = null;

export function setTuiLogCallback(callback: (level: string, message: string) => void) {
  tuiLogCallback = callback;
}

logger.on('data', (info) => {
  if (tuiLogCallback && info.level !== 'http') {
    tuiLogCallback(info.level, info.message);
  }
});

export default logger;
