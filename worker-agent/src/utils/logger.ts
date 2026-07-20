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

// Transporte personalizado para TUI (evita duplicación por múltiples transports)
class TuiTransport extends winston.Transport {
  private callback: ((level: string, message: string) => void) | null = null;

  log(info: any, callback: () => void) {
    if (this.callback && info.level !== 'http') {
      this.callback(info.level, info.message);
    }
    callback();
  }

  setCallback(cb: (level: string, message: string) => void) {
    this.callback = cb;
  }
}

const tuiTransport = new TuiTransport();

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format,
  transports: [
    tuiTransport,
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

export function setTuiLogCallback(callback: (level: string, message: string) => void) {
  tuiTransport.setCallback(callback);
}

export default logger;
