import { Request, Response, NextFunction } from 'express';
import { getWorkerByApiKey } from '../services/worker.service';

/**
 * Extender Request para incluir worker
 */
declare global {
  namespace Express {
    interface Request {
      worker?: {
        id: string;
        name: string;
        location: string;
        status: string;
        deviceId?: string;
      };
    }
  }
}

/**
 * Middleware para autenticar workers mediante API key
 */
export async function authenticateWorker(req: Request, res: Response, next: NextFunction) {
  try {
    // Obtener API key del header
    const apiKey = req.headers['x-worker-api-key'] as string;

    if (!apiKey) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing API key. Provide X-Worker-API-Key header.',
      });
    }

    // Verificar API key y obtener worker
    const worker = await getWorkerByApiKey(apiKey);

    // Agregar worker al request
    req.worker = {
      id: worker.id,
      name: worker.name,
      location: worker.location,
      status: worker.status,
      deviceId: worker.deviceId || undefined,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid API key',
    });
  }
}

/**
 * Middleware para verificar que el worker esté ONLINE
 */
export async function requireWorkerOnline(req: Request, res: Response, next: NextFunction) {
  if (!req.worker) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Worker not authenticated',
    });
  }

  if (req.worker.status !== 'ONLINE' && req.worker.status !== 'BUSY') {
    return res.status(403).json({
      error: 'Forbidden',
      message: `Worker is ${req.worker.status}. Cannot perform this action.`,
    });
  }

  next();
}

/**
 * Middleware opcional de autenticación (no falla si no hay API key)
 */
export async function optionalWorkerAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const apiKey = req.headers['x-worker-api-key'] as string;

    if (apiKey) {
      const worker = await getWorkerByApiKey(apiKey);
      req.worker = {
        id: worker.id,
        name: worker.name,
        location: worker.location,
        status: worker.status,
        deviceId: worker.deviceId || undefined,
      };
    }

    next();
  } catch (error) {
    // No fallar, continuar sin worker
    next();
  }
}
