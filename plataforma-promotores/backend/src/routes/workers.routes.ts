import { Router } from 'express';
import multer from 'multer';
import {
  registerWorkerHandler,
  heartbeatHandler,
  getWorkersHandler,
  getWorkerHandler,
  getWorkersStatsHandler,
  deleteWorkerHandler,
  updateWorkerHandler,
  getPendingJobHandler,
  startJobHandler,
  completeJobHandler,
  failJobHandler,
  uploadScreenshotHandler,
  getQueueStatsHandler,
  healthCheckHandler,
} from '../controllers/worker.controller';
import { authenticateWorker, requireWorkerOnline, optionalWorkerAuth } from '../middleware/workerAuth.middleware';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Configurar Multer para uploads en memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB máximo
  },
  fileFilter: (req, file, cb) => {
    // Aceptar solo imágenes
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// ============================================
// Rutas públicas (requieren autenticación de worker)
// ============================================

// Registrar nuevo worker
router.post('/register', registerWorkerHandler);

// Health check
router.get('/health', optionalWorkerAuth, healthCheckHandler);

// ============================================
// Rutas de workers (requieren autenticación)
// ============================================

// Heartbeat
router.put('/:id/heartbeat', authenticateWorker, heartbeatHandler);

// Obtener próximo trabajo pendiente
router.get('/jobs/pending', authenticateWorker, requireWorkerOnline, getPendingJobHandler);

// Iniciar trabajo
router.post('/jobs/:id/start', authenticateWorker, startJobHandler);

// Completar trabajo
router.post('/jobs/:id/complete', authenticateWorker, completeJobHandler);

// Marcar trabajo como fallido
router.post('/jobs/:id/fail', authenticateWorker, failJobHandler);

// Subir screenshot
router.post('/jobs/:id/screenshots', authenticateWorker, upload.single('screenshot'), uploadScreenshotHandler);

// ============================================
// Rutas de administración (requieren autenticación de admin)
// ============================================

// Obtener todos los workers
router.get('/', authMiddleware, adminMiddleware, getWorkersHandler);

// Obtener estadísticas de workers
router.get('/stats', authMiddleware, adminMiddleware, getWorkersStatsHandler);

// Obtener worker por ID
router.get('/:id', authMiddleware, adminMiddleware, getWorkerHandler);

// Actualizar worker
router.patch('/:id', authMiddleware, adminMiddleware, updateWorkerHandler);

// Eliminar worker
router.delete('/:id', authMiddleware, adminMiddleware, deleteWorkerHandler);

// Obtener estadísticas de cola
router.get('/queue/stats', authMiddleware, adminMiddleware, getQueueStatsHandler);

export default router;
