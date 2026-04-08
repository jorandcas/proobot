import { Router } from 'express';
import { BotController } from '../controllers/bot.controller';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication and admin role
router.use(authMiddleware);
router.use(adminMiddleware);

// Bot execution
router.post('/execute', BotController.execute);
router.post('/cancel', BotController.cancel);
router.get('/status', BotController.getStatus);
router.get('/history', BotController.getHistory);
router.get('/execution/:id', BotController.getExecutionById);
router.get('/tramite/:idTramite/logs', BotController.getTramiteLogs);

// Device management
router.get('/devices', BotController.getDevices);
router.post('/devices', BotController.addDevice);
router.delete('/devices/:id', BotController.deleteDevice);

export default router;
