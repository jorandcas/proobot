import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Promotor routes
router.get('/promotor', DashboardController.getPromotorStats);
router.get('/recent', DashboardController.getRecentTramites);

// Admin routes
router.get('/admin', adminMiddleware, DashboardController.getAdminStats);

// Both roles
router.get('/campana/:idCampana', DashboardController.getTramitesByCampana);

export default router;
