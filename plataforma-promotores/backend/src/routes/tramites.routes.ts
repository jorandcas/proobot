import { Router } from 'express';
import { TramitesController } from '../controllers/tramites.controller';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Public routes (for authenticated users)
router.get('/', TramitesController.getAll);
router.get('/:id', TramitesController.getById);
router.get('/fvc/fechas', TramitesController.getFVCFechas);

// Promotor routes
router.post('/', TramitesController.create);
router.put('/:id/cancel', TramitesController.cancel);
router.put('/:id/corregir', TramitesController.updateAndRetry);

// Admin routes
router.put('/:id', adminMiddleware, TramitesController.update);
router.delete('/:id', adminMiddleware, TramitesController.delete);
router.put('/:id/reset', adminMiddleware, TramitesController.resetToPending);
router.get('/pending/list', adminMiddleware, TramitesController.getPending);

export default router;
