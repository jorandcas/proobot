import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno
dotenv.config();

export const config = {
  // Backend Connection
  apiUrl: process.env.API_URL || 'http://localhost:3001',
  apiKey: process.env.API_KEY || '',

  // Worker Identity
  workerName: process.env.WORKER_NAME || 'Worker-Local-1',
  workerLocation: process.env.WORKER_LOCATION || 'Local Development',
  deviceId: process.env.DEVICE_ID || '',

  // Polling Configuration
  pollInterval: parseInt(process.env.POLL_INTERVAL || '5000'), // 5 segundos
  heartbeatInterval: parseInt(process.env.HEARTBEAT_INTERVAL || '30000'), // 30 segundos

  // Appium Configuration
  appiumServer: process.env.APPIUM_SERVER || 'http://localhost:4723',
  appiumCapabilities: JSON.parse(process.env.APPIUM_CAPABILITIES || '{}'),

  // Evidence Configuration
  evidenceUploadEnabled: process.env.EVIDENCE_UPLOAD_ENABLED === 'true',
  evidencePath: path.join(process.cwd(), process.env.EVIDENCE_PATH || './evidence'),
  screenshotsEnabled: process.env.SCREENSHOTS_ENABLED !== 'false',
  videoRecording: process.env.VIDEO_RECORDING === 'true',

  // Bot Configuration
  botScriptPath: process.env.BOT_SCRIPT_PATH || '../poc-login',
  botTimeout: parseInt(process.env.BOT_TIMEOUT || '600000'), // 10 minutos

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  logFile: process.env.LOG_FILE || './logs/worker.log',
} as const;

export default config;
