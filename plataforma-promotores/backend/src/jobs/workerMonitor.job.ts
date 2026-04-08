import { checkOfflineWorkers } from '../services/worker.service';
import { cleanOldJobs } from '../services/queue.service';
import { cleanOldEvidence } from '../services/evidence.service';

/**
 * Configuración del monitor de workers
 */
const WORKER_MONITOR_CONFIG = {
  // Intervalo de verificación (ms)
  checkInterval: parseInt(process.env.WORKER_CHECK_INTERVAL || '60000'), // 1 minuto por defecto
  // Timeout para considerar worker offline (ms)
  workerTimeout: parseInt(process.env.WORKER_TIMEOUT || '120000'), // 2 minutos por defecto
  // Intervalo de limpieza (ms)
  cleanInterval: parseInt(process.env.CLEAN_INTERVAL || '3600000'), // 1 hora por defecto
  // Edad máxima de trabajos para limpiar (ms)
  maxJobAge: parseInt(process.env.MAX_JOB_AGE || '604800000'), // 7 días por defecto
  // Edad máxima de evidencias para limpiar (ms)
  maxEvidenceAge: parseInt(process.env.MAX_EVIDENCE_AGE || '604800000'), // 7 días por defecto
};

let workerCheckInterval: NodeJS.Timeout | null = null;
let cleanInterval: NodeJS.Timeout | null = null;

/**
 * Verificar workers offline
 */
async function checkOffline() {
  try {
    console.log('🔍 Checking for offline workers...');

    const offlineCount = await checkOfflineWorkers(WORKER_MONITOR_CONFIG.workerTimeout);

    if (offlineCount > 0) {
      console.log(`⚠️  Found ${offlineCount} offline workers`);
    } else {
      console.log('✅ All workers are online');
    }
  } catch (error) {
    console.error('❌ Error checking offline workers:', error);
  }
}

/**
 * Limpiar trabajos y evidencias antiguas
 */
async function cleanup() {
  try {
    console.log('🧹 Starting cleanup process...');

    // Limpiar trabajos antiguos
    const deletedJobs = await cleanOldJobs(WORKER_MONITOR_CONFIG.maxJobAge);
    console.log(`🗑️  Deleted ${deletedJobs} old jobs`);

    // Limpiar evidencias antiguas
    const deletedEvidence = await cleanOldEvidence(WORKER_MONITOR_CONFIG.maxEvidenceAge);
    console.log(`🗑️  Deleted ${deletedEvidence} old evidence folders`);

    console.log('✅ Cleanup completed');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

/**
 * Iniciar monitor de workers
 */
export function startWorkerMonitor() {
  console.log('🚀 Starting worker monitor...');

  // Verificar workers offline cada minuto
  workerCheckInterval = setInterval(checkOffline, WORKER_MONITOR_CONFIG.checkInterval);

  // Limpiar datos antiguos cada hora
  cleanInterval = setInterval(cleanup, WORKER_MONITOR_CONFIG.cleanInterval);

  // Ejecutar verificación inicial
  checkOffline();

  // Ejecutar limpieza inicial
  cleanup();

  console.log('✅ Worker monitor started');
  console.log(`   - Check interval: ${WORKER_MONITOR_CONFIG.checkInterval}ms`);
  console.log(`   - Worker timeout: ${WORKER_MONITOR_CONFIG.workerTimeout}ms`);
  console.log(`   - Clean interval: ${WORKER_MONITOR_CONFIG.cleanInterval}ms`);
}

/**
 * Detener monitor de workers
 */
export function stopWorkerMonitor() {
  console.log('🛑 Stopping worker monitor...');

  if (workerCheckInterval) {
    clearInterval(workerCheckInterval);
    workerCheckInterval = null;
  }

  if (cleanInterval) {
    clearInterval(cleanInterval);
    cleanInterval = null;
  }

  console.log('✅ Worker monitor stopped');
}

// Si este archivo se ejecuta directamente, iniciar el monitor
if (require.main === module) {
  startWorkerMonitor();

  // Manejar shutdown
  process.on('SIGINT', () => {
    console.log('\n👋 Received SIGINT, shutting down gracefully...');
    stopWorkerMonitor();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n👋 Received SIGTERM, shutting down gracefully...');
    stopWorkerMonitor();
    process.exit(0);
  });

  // Mantener el proceso vivo
  console.log('🔄 Worker monitor is running. Press Ctrl+C to stop.');
}
