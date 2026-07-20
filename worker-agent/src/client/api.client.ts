import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import config from '../config/env';
import logger from '../utils/logger';

/**
 * Cliente de API para comunicarse con el backend
 */
export class ApiClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiUrl: string = config.apiUrl, apiKey: string = config.apiKey) {
    this.apiKey = apiKey;

    this.client = axios.create({
      baseURL: apiUrl,
      timeout: 30000, // 30 segundos
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para agregar API key
    this.client.interceptors.request.use((config) => {
      if (this.apiKey) {
        config.headers['X-Worker-API-Key'] = this.apiKey;
      }
      return config;
    });

    // Interceptor para respuestas
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          logger.error(`API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        } else if (error.request) {
          logger.error(`API Error: No response received - ${error.message}`);
        } else {
          logger.error(`API Error: ${error.message}`);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Establecer API key
   */
  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
    logger.info('API key updated');
  }

  /**
   * Registrar worker
   */
  async registerWorker(data: { name: string; location: string; deviceId?: string }) {
    try {
      const response = await this.client.post('/workers/register', data);
      return response.data;
    } catch (error) {
      logger.error('Error registering worker:', error);
      throw error;
    }
  }

  /**
   * Enviar heartbeat
   */
  async sendHeartbeat(workerId: string) {
    try {
      const response = await this.client.put(`/workers/${workerId}/heartbeat`);
      return response.data;
    } catch (error) {
      logger.error('Error sending heartbeat:', error);
      throw error;
    }
  }

  /**
   * Obtener próximo trabajo pendiente
   */
  async getPendingJob() {
    try {
      const response = await this.client.get('/workers/jobs/pending');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 204) {
        return null; // No hay trabajos pendientes
      }
      logger.error('Error getting pending job:', error);
      throw error;
    }
  }

  /**
   * Iniciar trabajo
   */
  async startJob(jobId: string) {
    try {
      const response = await this.client.post(`/workers/jobs/${jobId}/start`);
      return response.data;
    } catch (error) {
      logger.error(`Error starting job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Completar trabajo
   */
  async completeJob(jobId: string, data: { folioId: string; logs?: string[]; screenshots?: string[]; metadata?: any }) {
    try {
      const response = await this.client.post(`/workers/jobs/${jobId}/complete`, data);
      return response.data;
    } catch (error) {
      logger.error(`Error completing job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Marcar trabajo como fallido
   */
  async failJob(jobId: string, data: { error: string; logs?: string[]; screenshots?: string[] }) {
    try {
      const response = await this.client.post(`/workers/jobs/${jobId}/fail`, data);
      return response.data;
    } catch (error) {
      logger.error(`Error failing job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Subir screenshot
   */
  async uploadScreenshot(jobId: string, imagePath: string) {
    try {
      const form = new FormData();
      form.append('screenshot', fs.createReadStream(imagePath));

      const response = await this.client.post(`/workers/jobs/${jobId}/screenshots`, form, {
        headers: {
          ...form.getHeaders(),
        },
      });

      return response.data;
    } catch (error) {
      logger.error(`Error uploading screenshot for job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const response = await this.client.get('/workers/health');
      return response.data;
    } catch (error) {
      logger.error('Error in health check:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de cola
   */
  async getQueueStats() {
    try {
      const response = await this.client.get('/workers/queue/stats');
      return response.data;
    } catch (error) {
      logger.error('Error getting queue stats:', error);
      throw error;
    }
  }
}

export default ApiClient;
