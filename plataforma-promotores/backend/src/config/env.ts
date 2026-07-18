import dotenv from 'dotenv';
import path from 'path';

// Load .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

interface EnvConfig {
  port: number;
  nodeEnv: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  adminEmail: string;
  adminPassword: string;
  adminName: string;
  botTimeout: number;
  botRetryAttempts: number;
  botRetryDelay: number;
}

const config: EnvConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@govi.mx',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
  adminName: process.env.ADMIN_NAME || 'Administrador',
  botTimeout: parseInt(process.env.BOT_TIMEOUT || '300000', 10), // 5 minutes default
  botRetryAttempts: parseInt(process.env.BOT_RETRY_ATTEMPTS || '3', 10),
  botRetryDelay: parseInt(process.env.BOT_RETRY_DELAY || '5000', 10),
};

export default config;
