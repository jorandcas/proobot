import config from '../config/env';
import logger from '../utils/logger';
import ApiClient from '../client/api.client';
import AppiumExecutor, { BotExecutionResult } from '../executor/appium.executor';

/**
 * Worker Agent - Agente principal que ejecuta en nodos locales
 */
export class WorkerAgent {
  private apiClient: ApiClient;
  private executor: AppiumExecutor;
  private workerId: string | null = null;
  private isRunning: boolean = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private pollInterval: NodeJS.Timeout | null = null;
  private currentJob: any = null;

  constructor() {
    this.apiClient = new ApiClient();
    this.executor = new AppiumExecutor();
  }

  /**
   * Iniciar agente
   */
  async start() {
    if (this.isRunning) {
      logger.warn('Worker agent is already running');
      return;
    }

    logger.info('Starting worker agent...');
    logger.info(`Worker name: ${config.workerName}`);
    logger.info(`Worker location: ${config.workerLocation}`);
    logger.info(`API URL: ${config.apiUrl}`);

    try {
      // Registrar worker en el backend
      await this.register();

      // Iniciar heartbeat
      this.startHeartbeat();

      // Iniciar polling de trabajos
      this.startPolling();

      this.isRunning = true;

      logger.info('✅ Worker agent started successfully');
      logger.info(`Worker ID: ${this.workerId}`);
    } catch (error) {
      logger.error('Failed to start worker agent:', error);
      throw error;
    }
  }

  /**
   * Registrar worker en el backend
   */
  private async register() {
    try {
      logger.info('Registering worker with backend...');

      const response = await this.apiClient.registerWorker({
        name: config.workerName,
        location: config.workerLocation,
        deviceId: config.deviceId || undefined,
      });

      this.workerId = response.worker.id;
      const apiKey = response.worker.apiKey;

      // Actualizar API key del cliente
      this.apiClient.setApiKey(apiKey);

      logger.info(`Worker registered successfully: ${this.workerId}`);
      logger.info('API key received and configured');
    } catch (error) {
      logger.error('Error registering worker:', error);
      throw error;
    }
  }

  /**
   * Iniciar envío de heartbeats
   */
  private startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(async () => {
      try {
        if (this.workerId) {
          await this.apiClient.sendHeartbeat(this.workerId);
          logger.debug('Heartbeat sent successfully');
        }
      } catch (error) {
        logger.error('Error sending heartbeat:', error);
        // Si falla el heartbeat, intentar reconectar
        await this.handleConnectionError();
      }
    }, config.heartbeatInterval);

    logger.info(`Heartbeat started (interval: ${config.heartbeatInterval}ms)`);
  }

  /**
   * Iniciar polling de trabajos
   */
  private startPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }

    this.pollInterval = setInterval(async () => {
      // Si ya hay un trabajo en ejecución, no hacer polling
      if (this.currentJob) {
        logger.debug('Job already in progress, skipping poll');
        return;
      }

      await this.pollForJobs();
    }, config.pollInterval);

    logger.info(`Job polling started (interval: ${config.pollInterval}ms)`);
  }

  /**
   * Consultar trabajos pendientes
   */
  private async pollForJobs() {
    try {
      const response = await this.apiClient.getPendingJob();

      if (!response || !response.job) {
        logger.debug('No pending jobs');
        return;
      }

      const job = response.job;
      logger.info(`📋 New job received: ${job.id} (Trámite: ${job.tramiteId})`);

      // Procesar trabajo
      await this.processJob(job);
    } catch (error) {
      logger.error('Error polling for jobs:', error);
    }
  }

  /**
   * Procesar un trabajo
   */
  private async processJob(job: any) {
    this.currentJob = job;

    try {
      logger.info(`▶️  Starting job ${job.id}...`);

      // Marcar como iniciado
      await this.apiClient.startJob(job.id);

      // Ejecutar bot
      const result = await this.executor.executeJob(job);

      if (result.success) {
        // Completar trabajo exitosamente
        logger.info(`✅ Job ${job.id} completed successfully. FolioID: ${result.folioId}`);

        await this.apiClient.completeJob(job.id, {
          folioId: result.folioId || '',
          logs: result.logs,
          screenshots: result.screenshots,
          metadata: result.metadata,
        });
      } else {
        // Marcar como fallido
        logger.error(`❌ Job ${job.id} failed: ${result.error}`);

        await this.apiClient.failJob(job.id, {
          error: result.error || 'Unknown error',
          logs: result.logs,
          screenshots: result.screenshots,
        });
      }
    } catch (error) {
      logger.error(`Error processing job ${job.id}:`, error);

      try {
        await this.apiClient.failJob(job.id, {
          error: error instanceof Error ? error.message : 'Unknown error',
          logs: [],
          screenshots: [],
        });
      } catch (reportError) {
        logger.error('Error reporting failed job:', reportError);
      }
    } finally {
      this.currentJob = null;
    }
  }

  /**
   * Manejar errores de conexión
   */
  private async handleConnectionError() {
    logger.warn('Connection error detected, attempting to reconnect...');

    // Esperar antes de intentar reconectar
    await new Promise((resolve) => setTimeout(resolve, 5000));

    try {
      // Verificar health check
      await this.apiClient.healthCheck();
      logger.info('Connection restored');
    } catch (error) {
      logger.error('Reconnection failed, will retry on next heartbeat');
    }
  }

  /**
   * Detener agente
   */
  async stop() {
    logger.info('Stopping worker agent...');

    this.isRunning = false;

    // Detener heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Detener polling
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    logger.info('Worker agent stopped');
  }

  /**
   * Obtener estadísticas
   */
  getStats() {
    return {
      workerId: this.workerId,
      isRunning: this.isRunning,
      currentJob: this.currentJob ? this.currentJob.id : null,
      config: {
        pollInterval: config.pollInterval,
        heartbeatInterval: config.heartbeatInterval,
      },
    };
  }
}

export default WorkerAgent;
