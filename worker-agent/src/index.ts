import 'dotenv/config';
import WorkerAgent from './worker/agent';
import logger from './utils/logger';
import config from './config/env';
import { startTUI, addLogToDashboard } from './tui';
import { kioskManager } from './tui/utils/kiosk';
import { workerEvents } from './events/worker-events';

let agent: WorkerAgent;

/**
 * Iniciar agente
 */
async function start() {
  try {
    // Iniciar TUI primero
    startTUI();

    addLogToDashboard('info', '╔════════════════════════════════════════════════════════════╗');
    addLogToDashboard('info', '║          MOVISTAR WORKER AGENT - STARTING                  ║');
    addLogToDashboard('info', '════════════════════════════════════════════════════════════╝');
    addLogToDashboard('info', `Environment: ${process.env.NODE_ENV || 'development'}`);
    addLogToDashboard('info', `Log Level: ${config.logLevel}`);
    addLogToDashboard('info', `API URL: ${config.apiUrl}`);
    addLogToDashboard('info', `Worker Name: ${config.workerName}`);
    addLogToDashboard('info', `Worker Location: ${config.workerLocation}`);
    addLogToDashboard('info', `Poll Interval: ${config.pollInterval}ms`);
    addLogToDashboard('info', `Heartbeat Interval: ${config.heartbeatInterval}ms`);
    addLogToDashboard('info', '');

    agent = new WorkerAgent();
    await agent.start();

    addLogToDashboard('info', '');
    addLogToDashboard('info', '╔════════════════════════════════════════════════════════════╗');
    addLogToDashboard('info', '║          WORKER AGENT IS RUNNING                           ║');
    addLogToDashboard('info', '║          Usa Q para salir                                  ║');
    addLogToDashboard('info', '╚════════════════════════════════════════════════════════════╝');
  } catch (error) {
    addLogToDashboard('error', `Failed to start worker agent: ${error}`);
    logger.error('Failed to start worker agent:', error);
    process.exit(1);
  }
}

/**
 * Manejar señales de shutdown
 */
async function shutdown(signal: string) {
  addLogToDashboard('warn', `════════════════════════════════════════════════════════════╗`);
  addLogToDashboard('warn', `║          RECEIVED ${signal} - SHUTTING DOWN                  ║`);
  addLogToDashboard('warn', '╚════════════════════════════════════════════════════════════╝');

  if (agent) {
    try {
      await agent.stop();
      addLogToDashboard('info', 'Worker agent stopped gracefully');
    } catch (error) {
      addLogToDashboard('error', `Error stopping agent: ${error}`);
      process.exit(1);
    }
  }

  addLogToDashboard('info', 'Exiting...');
  process.exit(0);
}

// Manejar señales de termination
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Manejar reinicio desde TUI (F5)
process.on('SIGUSR1', () => {
  addLogToDashboard('warn', 'Reinicio solicitado desde TUI...');
  if (agent) {
    agent.stop().then(() => {
      setTimeout(() => {
        start();
      }, 2000);
    });
  }
});

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
  addLogToDashboard('error', `Uncaught Exception: ${error.message}`);
  logger.error('Uncaught Exception:', error);
  shutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  addLogToDashboard('error', `Unhandled Rejection: ${reason}`);
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  shutdown('UNHANDLED_REJECTION');
});

// Verificar modo kiosko
if (process.env.KIOSK_MODE === 'true') {
  kioskManager.start();
} else {
  // Iniciar agente normalmente
  start();
}
