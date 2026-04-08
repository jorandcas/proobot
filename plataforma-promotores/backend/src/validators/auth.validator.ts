import { LoginRequest } from '../types';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthValidator {
  // Email format
  static validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('El email no tiene un formato válido');
    }
  }

  // Password strength (basic)
  static validatePassword(password: string): void {
    if (!password || password.length < 6) {
      throw new ValidationError('La contraseña debe tener al menos 6 caracteres');
    }
  }

  // Name format
  static validateName(nombre: string): void {
    if (!nombre || nombre.trim().length < 2) {
      throw new ValidationError('El nombre debe tener al menos 2 caracteres');
    }
  }

  // Validate login request
  static validateLogin(data: LoginRequest): void {
    if (!data.correo || !data.correo.trim()) {
      throw new ValidationError('El correo es obligatorio');
    }

    if (!data.contrasena || !data.contrasena.trim()) {
      throw new ValidationError('La contraseña es obligatoria');
    }

    this.validateEmail(data.correo);
  }

  // Validate user creation
  static validateCreateUser(data: {
    correo: string;
    contrasena: string;
    nombre: string;
    rol?: string;
  }): void {
    if (!data.correo || !data.correo.trim()) {
      throw new ValidationError('El correo es obligatorio');
    }

    if (!data.contrasena || !data.contrasena.trim()) {
      throw new ValidationError('La contraseña es obligatoria');
    }

    if (!data.nombre || !data.nombre.trim()) {
      throw new ValidationError('El nombre es obligatorio');
    }

    this.validateEmail(data.correo);
    this.validatePassword(data.contrasena);
    this.validateName(data.nombre);

    if (data.rol && data.rol !== 'admin' && data.rol !== 'promotor') {
      throw new ValidationError('El rol debe ser "admin" o "promotor"');
    }
  }

  // Sanitize email
  static sanitizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  // Sanitize name
  static sanitizeName(nombre: string): string {
    return nombre.trim();
  }
}
