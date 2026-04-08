import { Router } from 'express';
import { CampanasController } from '../controllers/campanas.controller';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Public routes (for authenticated users)
router.get('/', CampanasController.getAll);
router.get('/active', CampanasController.getActive);
router.get('/with-tramites', CampanasController.getWithTramites);
router.get('/today-ensure', CampanasController.ensureToday);
router.get('/:id', CampanasController.getById);

// Admin routes
router.post('/', adminMiddleware, CampanasController.create);
router.put('/:id', adminMiddleware, CampanasController.update);
router.delete('/:id', adminMiddleware, CampanasController.delete);

export default router;
