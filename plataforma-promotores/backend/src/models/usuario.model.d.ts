import { Usuario, UsuarioResponse, UserRole } from '../types';
export declare class UsuarioModel {
    findByEmail(correo: string): Usuario | null;
    findById(id: string): Usuario | null;
    create(data: {
        correo: string;
        contrasena: string;
        rol: UserRole;
        nombre: string;
    }): Usuario;
    getAll(): UsuarioResponse[];
    getByRole(rol: UserRole): UsuarioResponse[];
    update(id: string, data: Partial<Omit<Usuario, 'id' | 'fechaCreacion'>>): Usuario | null;
    delete(id: string): boolean;
    sanitizeUser(usuario: Usuario): UsuarioResponse;
}
export declare const usuarioModel: UsuarioModel;
//# sourceMappingURL=usuario.model.d.ts.map