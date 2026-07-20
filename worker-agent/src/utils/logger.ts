import winston from 'winston';
import path from 'path';
import fs from 'fs';

const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

let tuiCallback: ((level: string, message: string) => void) | null = null;
let lastLogKey = '';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format,
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'worker.log'),
      maxsize: 10485760,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10485760,
      maxFiles: 5,
    }),
  ],
});

// Escuchar logs una sola vez (deduplicar por timestamp+mensaje)
logger.on('data', (info) => {
  const key = `${info.timestamp}-${info.message}`;
  if (key !== lastLogKey && tuiCallback && info.level !== 'http') {
    lastLogKey = key;
    tuiCallback(info.level, info.message);
  }
});

export function setTuiLogCallback(callback: (level: string, message: string) => void) {
  tuiCallback = callback;
}

export default logger;
