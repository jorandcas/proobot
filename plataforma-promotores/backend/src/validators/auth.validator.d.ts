import { LoginRequest } from '../types';
export declare class ValidationError extends Error {
    constructor(message: string);
}
export declare class AuthValidator {
    static validateEmail(email: string): void;
    static validatePassword(password: string): void;
    static validateName(nombre: string): void;
    static validateLogin(data: LoginRequest): void;
    static validateCreateUser(data: {
        correo: string;
        contrasena: string;
        nombre: string;
        rol?: string;
    }): void;
    static sanitizeEmail(email: string): string;
    static sanitizeName(nombre: string): string;
}
//# sourceMappingURL=auth.validator.d.ts.map