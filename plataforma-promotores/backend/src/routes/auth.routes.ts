import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/login', AuthController.login);
router.post('/init-admin', AuthController.initAdmin);

// Protected routes
router.get('/me', authMiddleware, AuthController.me);
router.post('/change-password', authMiddleware, AuthController.changePassword);

// Admin routes
router.post('/users', authMiddleware, adminMiddleware, AuthController.createUser);
router.get('/users', authMiddleware, adminMiddleware, AuthController.getAllUsers);
router.post('/revoke-session/:usuarioId', authMiddleware, adminMiddleware, AuthController.revokeSession);

export default router;
