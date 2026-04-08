import { Request, Response } from 'express';
import { usuarioModel } from '../models/usuario.model';
import { PasswordUtil } from '../utils/password.util';
import { JwtUtil } from '../utils/jwt.util';
import { AuthValidator } from '../validators/auth.validator';
import config from '../config/env';

export class AuthController {
  // Login
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { correo, contrasena } = req.body;

      // Validate
      AuthValidator.validateLogin({ correo, contrasena });

      // Find user
      const usuario = await usuarioModel.findByEmail(correo);
      if (!usuario) {
        res.status(401).json({
          success: false,
          error: 'Credenciales inválidas',
        });
        return;
      }

      // Check password
      const passwordMatch = await PasswordUtil.compare(contrasena, usuario.contrasena);
      if (!passwordMatch) {
        res.status(401).json({
          success: false,
          error: 'Credenciales inválidas',
        });
        return;
      }

      // Generate token
      const token = JwtUtil.generateToken({
        usuarioId: usuario.id,
        correo: usuario.correo,
        rol: usuario.rol,
        tokenVersion: usuario.tokenVersion || 0,
      });

      res.json({
        success: true,
        data: {
          token,
          usuario: usuarioModel.sanitizeUser(usuario),
        },
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'ValidationError') {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      console.error('Error en login:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      });
    }
  }

  // Get current user
  static async me(req: Request, res: Response): Promise<void> {
    try {
      if (!req.usuario) {
        res.status(401).json({
          success: false,
          error: 'No autenticado',
        });
        return;
      }

      const usuario = await usuarioModel.findById(req.usuario.id);
      if (!usuario) {
        res.status(404).json({
          success: false,
          error: 'Usuario no encontrado',
        });
        return;
      }

      res.json({
        success: true,
        data: usuarioModel.sanitizeUser(usuario),
      });
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      });
    }
  }

  // Create user (admin only)
  static async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { correo, contrasena, nombre, rol } = req.body;

      // Validate
      AuthValidator.validateCreateUser({
        correo,
        contrasena,
        nombre,
        rol,
      });

      // Check if user exists
      const existingUser = await usuarioModel.findByEmail(correo);
      if (existingUser) {
        res.status(400).json({
          success: false,
          error: 'El correo ya está registrado',
        });
        return;
      }

      // Hash password
      const hashedPassword = await PasswordUtil.hash(contrasena);

      // Create user
      const nuevoUsuario = await usuarioModel.create({
        correo: AuthValidator.sanitizeEmail(correo),
        contrasena: hashedPassword,
        rol: rol || 'promotor',
        nombre: AuthValidator.sanitizeName(nombre),
      });

      res.status(201).json({
        success: true,
        data: usuarioModel.sanitizeUser(nuevoUsuario),
        message: 'Usuario creado exitosamente',
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'ValidationError') {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      console.error('Error creando usuario:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      });
    }
  }

  // Initialize admin user (first time setup)
  static async initAdmin(req: Request, res: Response): Promise<void> {
    try {
      // Check if admin already exists
      const existingAdmin = await usuarioModel.findByEmail(config.adminEmail);
      if (existingAdmin) {
        res.json({
          success: true,
          message: 'El usuario administrador ya existe',
          data: usuarioModel.sanitizeUser(existingAdmin),
        });
        return;
      }

      // Create admin user
      const hashedPassword = await PasswordUtil.hash(config.adminPassword);
      const admin = await usuarioModel.create({
        correo: config.adminEmail,
        contrasena: hashedPassword,
        rol: 'admin',
        nombre: config.adminName,
      });

      res.status(201).json({
        success: true,
        data: usuarioModel.sanitizeUser(admin),
        message: 'Usuario administrador creado exitosamente',
      });
    } catch (error) {
      console.error('Error inicializando admin:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      });
    }
  }

  // Change password
  static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      if (!req.usuario) {
        res.status(401).json({
          success: false,
          error: 'No autenticado',
        });
        return;
      }

      const { contrasenaActual, contrasenaNueva } = req.body;

      if (!contrasenaActual || !contrasenaNueva) {
        res.status(400).json({
          success: false,
          error: 'Se requieren la contraseña actual y la nueva',
        });
        return;
      }

      // Validate new password
      AuthValidator.validatePassword(contrasenaNueva);

      // Get user
      const usuario = await usuarioModel.findById(req.usuario.id);
      if (!usuario) {
        res.status(404).json({
          success: false,
          error: 'Usuario no encontrado',
        });
        return;
      }

      // Check current password
      const passwordMatch = await PasswordUtil.compare(contrasenaActual, usuario.contrasena);
      if (!passwordMatch) {
        res.status(401).json({
          success: false,
          error: 'La contraseña actual es incorrecta',
        });
        return;
      }

      // Hash new password
      const hashedNewPassword = await PasswordUtil.hash(contrasenaNueva);

      // Update password
      await usuarioModel.update(usuario.id, { contrasena: hashedNewPassword });

      res.json({
        success: true,
        message: 'Contraseña actualizada exitosamente',
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'ValidationError') {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      console.error('Error cambiando contraseña:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      });
    }
  }

  // Get all users (admin only)
  static async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const usuarios = await usuarioModel.getAll();

      res.json({
        success: true,
        data: usuarios,
      });
    } catch (error) {
      console.error('Error obteniendo usuarios:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      });
    }
  }

  // Revoke user session (admin only)
  static async revokeSession(req: Request, res: Response): Promise<void> {
    try {
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
          error: 'Solo administradores pueden revocar sesiones',
        });
        return;
      }

      const { usuarioId } = req.params;

      if (!usuarioId) {
        res.status(400).json({
          success: false,
          error: 'Se requiere el ID del usuario',
        });
        return;
      }

      // Get user
      const usuario = await usuarioModel.findById(usuarioId);
      if (!usuario) {
        res.status(404).json({
          success: false,
          error: 'Usuario no encontrado',
        });
        return;
      }

      // Increment token version to revoke all existing tokens
      const newTokenVersion = (usuario.tokenVersion || 0) + 1;
      await usuarioModel.update(usuarioId, { tokenVersion: newTokenVersion });

      res.json({
        success: true,
        message: 'Sesión revocada exitosamente',
      });
    } catch (error) {
      console.error('Error revocando sesión:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      });
    }
  }
}
