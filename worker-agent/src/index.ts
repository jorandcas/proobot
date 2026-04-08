import 'dotenv/config';
import WorkerAgent from './worker/agent';
import logger from './utils/logger';
import config from './config/env';

let agent: WorkerAgent;

/**
 * Iniciar agente
 */
async function start() {
  try {
    logger.info('╔════════════════════════════════════════════════════════════╗');
    logger.info('║          MOVISTAR WORKER AGENT - STARTING                  ║');
    logger.info('╚════════════════════════════════════════════════════════════╝');
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`Log Level: ${config.logLevel}`);
    logger.info(`API URL: ${config.apiUrl}`);
    logger.info(`Worker Name: ${config.workerName}`);
    logger.info(`Worker Location: ${config.workerLocation}`);
    logger.info(`Poll Interval: ${config.pollInterval}ms`);
    logger.info(`Heartbeat Interval: ${config.heartbeatInterval}ms`);
    logger.info('');

    agent = new WorkerAgent();
    await agent.start();

    logger.info('');
    logger.info('╔════════════════════════════════════════════════════════════╗');
    logger.info('║          WORKER AGENT IS RUNNING                           ║');
    logger.info('║          Press Ctrl+C to stop                              ║');
    logger.info('╚════════════════════════════════════════════════════════════╝');
  } catch (error) {
    logger.error('Failed to start worker agent:', error);
    process.exit(1);
  }
}

/**
 * Manejar señales de shutdown
 */
async function shutdown(signal: string) {
  logger.info('');
  logger.info(`╔════════════════════════════════════════════════════════════╗`);
  logger.info(`║          RECEIVED ${signal} - SHUTTING DOWN                  ║`);
  logger.info('╚════════════════════════════════════════════════════════════╝');

  if (agent) {
    try {
      await agent.stop();
      logger.info('Worker agent stopped gracefully');
    } catch (error) {
      logger.error('Error stopping agent:', error);
      process.exit(1);
    }
  }

  logger.info('Exiting...');
  process.exit(0);
}

// Manejar señales de termination
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  shutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  shutdown('UNHANDLED_REJECTION');
});

// Iniciar agente
start();
