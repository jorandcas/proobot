import express from 'express';
import { ENV, log } from './config/env';
import { executeBot, BotExecutionRequest, cancelExecution } from './bot';
import { healthCheck, checkAppiumConnection } from './health';

const app = express();
const PORT = ENV.WORKER_PORT;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  log.info(`${req.method} ${req.path}`);
  next();
});

// CORS headers (for cross-origin requests from backend)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// OPTIONS handler for CORS preflight
app.options('*', (req, res) => {
  res.sendStatus(200);
});

// Routes

/**
 * GET /health
 * Health check endpoint for Coolify
 */
app.get('/health', async (req, res) => {
  try {
    const health = await healthCheck();
    const statusCode = health.status === 'unhealthy' ? 503 : 200;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /appium-check
 * Check if Appium server is reachable
 */
app.get('/appium-check', async (req, res) => {
  try {
    const isReachable = await checkAppiumConnection();
    res.json({
      reachable: isReachable,
      host: ENV.APPIUM_HOST,
      port: ENV.APPIUM_PORT,
    });
  } catch (error) {
    res.status(503).json({
      reachable: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /execute
 * Execute bot for a single trámite
 */
app.post('/execute', async (req, res) => {
  try {
    const body = req.body as BotExecutionRequest;

    // Validate required fields
    const requiredFields: (keyof BotExecutionRequest)[] = [
      'SEARCH_DN',
      'ICC',
      'FVC_FECHA',
      'LINEA_NIP',
      'DATOS_NOMBRE',
      'DATOS_APELLIDO_PATERNO',
      'DATOS_CURP',
      'DATOS_TELEFONO',
      'DATOS_FECHA_NACIMIENTO',
    ];

    const missingFields = requiredFields.filter(field => !body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`,
      });
    }

    log.info(`Starting bot execution for DN: ${body.SEARCH_DN}`);

    // Execute bot
    const result = await executeBot(body);

    if (result.success) {
      res.json({
        success: true,
        folioId: result.folioId,
        logs: result.logs,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        logs: result.logs,
      });
    }

  } catch (error) {
    log.error(`Error in /execute: ${error instanceof Error ? error.message : 'Unknown error'}`);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /cancel
 * Cancel current bot execution (emergency stop)
 */
app.post('/cancel', async (req, res) => {
  try {
    await cancelExecution();
    res.json({
      success: true,
      message: 'Bot execution cancelled',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /status
 * Get current execution status
 */
app.get('/status', (req, res) => {
  const { getExecutionStatus } = require('./bot');
  const status = getExecutionStatus();
  res.json(status);
});

/**
 * GET /
 * Root endpoint with API information
 */
app.get('/', (req, res) => {
  res.json({
    name: 'Movistar Bot Worker API',
    version: '1.0.0',
    workerId: ENV.WORKER_ID,
    deviceUdid: ENV.DEVICE_UDID,
    endpoints: {
      health: 'GET /health',
      appiumCheck: 'GET /appium-check',
      execute: 'POST /execute',
      cancel: 'POST /cancel',
      status: 'GET /status',
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  log.error(`Unhandled error: ${err.message}`);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// Start server
app.listen(PORT, () => {
  log.success(`Bot Worker API listening on port ${PORT}`);
  log.info(`Worker ID: ${ENV.WORKER_ID}`);
  log.info(`Device UDID: ${ENV.DEVICE_UDID}`);
  log.info(`Appium: ${ENV.APPIUM_HOST}:${ENV.APPIUM_PORT}`);
  log.info(`Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  log.info('SIGTERM received, shutting down gracefully...');
  try {
    await cancelExecution();
    process.exit(0);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log.error(`Error during shutdown: ${errorMessage}`);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  log.info('SIGINT received, shutting down gracefully...');
  try {
    await cancelExecution();
    process.exit(0);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log.error(`Error during shutdown: ${errorMessage}`);
    process.exit(1);
  }
});
