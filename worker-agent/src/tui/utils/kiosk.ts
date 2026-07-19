import { spawn, ChildProcess } from 'child_process';
import logger from '../../utils/logger';

const MAX_RESTARTS = 10;
const RESTART_DELAY = 3000;

export class KioskManager {
  private restartCount = 0;
  private childProcess: ChildProcess | null = null;
  private isRunning = false;

  start() {
    if (this.isRunning) {
      logger.warn('Kiosk mode is already running');
      return;
    }

    this.isRunning = true;
    this.restartCount = 0;
    this.run();
  }

  private run() {
    logger.info(`Iniciando worker en modo kiosko (intento ${this.restartCount + 1}/${MAX_RESTARTS})...`);

    this.childProcess = spawn('node', ['dist/index.js'], {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' },
    });

    this.childProcess.on('exit', (code, signal) => {
      // Si fue una salida limpia (usuario presionó Q), no reiniciar
      if (code === 0 && !signal) {
        logger.info('Worker detenido manualmente. Saliendo del modo kiosko.');
        this.isRunning = false;
        process.exit(0);
      }

      this.restartCount++;

      if (this.restartCount > MAX_RESTARTS) {
        logger.error('❌ Demasiados reinicios automáticos. Deteniendo para evitar loop infinito.');
        logger.error('Por favor, revisa los logs y contacta soporte si el problema persiste.');
        this.isRunning = false;
        process.exit(1);
      }

      logger.warn(`️ El worker se cerró inesperadamente. Reiniciando en ${RESTART_DELAY / 1000} segundos...`);

      setTimeout(() => {
        if (this.isRunning) {
          this.run();
        }
      }, RESTART_DELAY);
    });

    this.childProcess.on('error', (err) => {
      logger.error('Error al iniciar el worker:', err.message);
      this.isRunning = false;
      process.exit(1);
    });
  }

  stop() {
    if (this.childProcess) {
      this.childProcess.kill('SIGTERM');
      this.childProcess = null;
    }
    this.isRunning = false;
  }

  getRestartCount(): number {
    return this.restartCount;
  }
}

export const kioskManager = new KioskManager();
export default kioskManager;
