import jwt, { SignOptions } from 'jsonwebtoken';
import config from '../config/env';

export interface JwtPayload {
  usuarioId: string;
  correo: string;
  rol: string;
  tokenVersion?: number; // Para validar que el token no ha sido revocado
}

export class JwtUtil {
  // Generate JWT token
  static generateToken(payload: JwtPayload): string {
    return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn } as SignOptions);
  }

  // Verify JWT token
  static verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, config.jwtSecret) as JwtPayload;
    } catch (error) {
      throw new Error('Token inválido o expirado');
    }
  }

  // Decode token without verification (for debugging)
  static decodeToken(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch (error) {
      return null;
    }
  }
}
