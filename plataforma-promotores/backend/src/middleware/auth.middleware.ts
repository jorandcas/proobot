import { Request, Response, NextFunction } from 'express';
import { JwtUtil } from '../utils/jwt.util';
import { usuarioModel } from '../models/usuario.model';

// Extend Express Request type to include usuario
declare global {
  namespace Express {
    interface Request {
      usuario?: {
        id: string;
        correo: string;
        rol: string;
      };
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'No se proporcionó token de autenticación',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const payload = JwtUtil.verifyToken(token);

    // Verify user still exists
    const usuario = await usuarioModel.findById(payload.usuarioId);
    if (!usuario) {
      res.status(401).json({
        success: false,
        error: 'Usuario no encontrado',
      });
      return;
    }

    // Verify token version (session not revoked)
    if (payload.tokenVersion !== undefined && payload.tokenVersion !== (usuario.tokenVersion || 0)) {
      res.status(401).json({
        success: false,
        error: 'Sesión revocada. Por favor inicia sesión nuevamente',
      });
      return;
    }

    // Attach user info to request
    req.usuario = {
      id: usuario.id,
      correo: usuario.correo,
      rol: usuario.rol,
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Token inválido o expirado',
    });
  }
};

// Middleware to check if user is admin
export const adminMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.usuario) {
    res.status(401).json({
      success: false,
      error: 'No autenticado',
    });
    return;
  }

  if (req.usuario.rol !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Acceso denegado. Se requiere rol de administrador',
    });
    return;
  }

  next();
};

// Middleware to check if user is promotor
export const promotorMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.usuario) {
    res.status(401).json({
      success: false,
      error: 'No autenticado',
    });
    return;
  }

  if (req.usuario.rol !== 'promotor' && req.usuario.rol !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Acceso denegado. Se requiere rol de promotor o administrador',
    });
    return;
  }

  next();
};
