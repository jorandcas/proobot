import { spawn, ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import config from '../config/env';
import logger from '../utils/logger';

/**
 * Resultado de la ejecución del bot
 */
export interface BotExecutionResult {
  success: boolean;
  folioId?: string;
  logs: string[];
  screenshots: string[];
  error?: string;
  metadata?: any;
}

/**
 * Executor para ejecutar el bot de Appium
 */
export class AppiumExecutor extends EventEmitter {
  private evidencePath: string;
  private screenshots: string[] = [];
  private logs: string[] = [];

  constructor() {
    this.evidencePath = path.join(process.cwd(), config.evidencePath);
    this.ensureEvidenceDir();
  }

  /**
   * Asegurar que el directorio de evidencias existe
   */
  private ensureEvidenceDir() {
    if (!fs.existsSync(this.evidencePath)) {
      fs.mkdirSync(this.evidencePath, { recursive: true });
    }
  }

  /**
   * Ejecutar bot para un trámite
   */
  async executeJob(tramiteData: any): Promise<BotExecutionResult> {
    const jobId = tramiteData.id;
    logger.info(`Executing job ${jobId} for tramite ${tramiteData.tramiteId}`);

    // Emitir evento de inicio
    this.emit('progress', { jobId, progress: 5, message: 'Creando directorio de evidencias...' });

    // Crear directorio para el job
    const jobDir = path.join(this.evidencePath, jobId);
    if (!fs.existsSync(jobDir)) {
      fs.mkdirSync(jobDir, { recursive: true });
    }

    try {
      // Preparar datos para el bot
      const inputData = {
        ...tramiteData.tramite,
        jobId,
        outputDir: jobDir,
      };

      // Guardar datos de entrada en archivo JSON
      this.emit('progress', { jobId, progress: 15, message: 'Guardando datos de entrada...' });
      const inputFile = path.join(jobDir, 'input.json');
      fs.writeFileSync(inputFile, JSON.stringify(inputData, null, 2));

      // Ejecutar bot
      this.emit('progress', { jobId, progress: 25, message: 'Iniciando bot de Appium...' });
      const result = await this.runBotScript(inputFile, jobDir, jobId);

      // Recopilar evidencias
      this.emit('progress', { jobId, progress: 90, message: 'Recopilando evidencias...' });
      this.collectEvidence(jobDir);

      this.emit('progress', { jobId, progress: 100, message: 'Trabajo completado' });

      return {
        success: true,
        folioId: result.folioId,
        logs: this.logs,
        screenshots: this.screenshots,
        metadata: result.metadata,
      };
    } catch (error) {
      logger.error(`Error executing job ${jobId}:`, error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        logs: this.logs,
        screenshots: this.screenshots,
      };
    }
  }

  /**
   * Ejecutar script del bot
   */
  private async runBotScript(inputFile: string, outputDir: string, jobId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const botScript = path.join(process.cwd(), config.botScriptPath, 'dist', 'index.js');

      // Verificar que el script existe
      if (!fs.existsSync(botScript)) {
        this.emit('progress', { jobId, progress: 50, message: '⚠️ Bot script no encontrado - modo simulación' });
        logger.warn(`Bot script not found: ${botScript}`);
        // Simular éxito para testing
        setTimeout(() => {
          this.emit('progress', { jobId, progress: 100, message: 'Simulación completada' });
          resolve({ folioId: 'SIM-' + Date.now() });
        }, 2000);
        return;
      }

      logger.info(`Running bot script: ${botScript}`);
      this.emit('progress', { jobId, progress: 30, message: 'Ejecutando bot script...' });

      const args = [inputFile, outputDir];
      const options = {
        cwd: path.join(process.cwd(), config.botScriptPath),
        stdio: 'pipe' as const,
      };

      const childProcess = spawn('node', [botScript, ...args], options);

      let stdout = '';
      let stderr = '';
      let progress = 30;

      childProcess.stdout?.on('data', (data) => {
        const message = data.toString();
        stdout += message;
        this.logs.push(message.trim());
        logger.debug(`[BOT] ${message.trim()}`);

        // Emitir progreso basado en output del bot
        if (message.includes('screenshot') || message.includes('Screenshot')) {
          progress = Math.min(progress + 10, 85);
          this.emit('progress', { jobId, progress, message: '📸 Screenshot capturado' });
        } else if (message.includes('formulario') || message.includes('form')) {
          progress = Math.min(progress + 5, 80);
          this.emit('progress', { jobId, progress, message: '⏳ Procesando formulario...' });
        }
      });

      childProcess.stderr?.on('data', (data) => {
        const message = data.toString();
        stderr += message;
        logger.warn(`[BOT ERROR] ${message.trim()}`);
      });

      // Timeout
      const timeout = setTimeout(() => {
        childProcess.kill('SIGTERM');
        reject(new Error(`Bot execution timeout (${config.botTimeout}ms)`));
      }, config.botTimeout);

      childProcess.on('close', (code) => {
        clearTimeout(timeout);

        if (code === 0) {
          // Intentar leer resultado del archivo de salida
          const outputFile = path.join(outputDir, 'result.json');
          if (fs.existsSync(outputFile)) {
            try {
              const result = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));
              resolve(result);
            } catch (err) {
              // Si no hay archivo de resultado, intentar extraer de stdout
              const match = stdout.match(/FOLIO_ID:\s*([A-Z0-9-]+)/i);
              if (match) {
                resolve({ folioId: match[1] });
              } else {
                resolve({});
              }
            }
          } else {
            // Intentar extraer folio de stdout
            const match = stdout.match(/FOLIO_ID:\s*([A-Z0-9-]+)/i);
            if (match) {
              resolve({ folioId: match[1] });
            } else {
              resolve({});
            }
          }
        } else {
          reject(new Error(`Bot script exited with code ${code}: ${stderr || stdout}`));
        }
      });

      childProcess.on('error', (err) => {
        clearTimeout(timeout);
        reject(new Error(`Failed to start bot script: ${err.message}`));
      });
    });
  }

  /**
   * Recopilar evidencias del directorio del job
   */
  private collectEvidence(jobDir: string) {
    try {
      const files = fs.readdirSync(jobDir);

      // Buscar screenshots
      for (const file of files) {
        if (file.match(/\.(png|jpg|jpeg)$/i)) {
          this.screenshots.push(path.join(jobDir, file));
        }
      }

      // Buscar logs
      const logFile = path.join(jobDir, 'logs.txt');
      if (fs.existsSync(logFile)) {
        const logContent = fs.readFileSync(logFile, 'utf-8');
        this.logs = logContent.split('\n').filter((line) => line.trim());
      }

      logger.info(`Collected ${this.screenshots.length} screenshots and ${this.logs.length} log lines`);
    } catch (error) {
      logger.warn('Error collecting evidence:', error);
    }
  }

  /**
   * Limpiar evidencias antiguas
   */
  cleanOldEvidence(maxAge = 7 * 24 * 60 * 60 * 1000) {
    // 7 días por defecto
    try {
      const now = Date.now();
      const dirs = fs.readdirSync(this.evidencePath);

      let deletedCount = 0;

      for (const dir of dirs) {
        const dirPath = path.join(this.evidencePath, dir);
        const stats = fs.statSync(dirPath);

        if (stats.isDirectory() && now - stats.mtimeMs > maxAge) {
          fs.rmSync(dirPath, { recursive: true, force: true });
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        logger.info(`Cleaned ${deletedCount} old evidence directories`);
      }
    } catch (error) {
      logger.error('Error cleaning old evidence:', error);
    }
  }
}

export default AppiumExecutor;
