import { prisma } from '../config/database.prisma';
import { Usuario, UsuarioResponse, UserRole } from '../types';

export class UsuarioModel {
  // Find user by email
  async findByEmail(correo: string): Promise<Usuario | null> {
    const usuario = await prisma.usuario.findUnique({
      where: { correo: correo.toLowerCase() },
    });

    if (!usuario) return null;

    return this.mapPrismaToUsuario(usuario);
  }

  // Find user by ID
  async findById(id: string): Promise<Usuario | null> {
    const usuario = await prisma.usuario.findUnique({
      where: { id },
    });

    if (!usuario) return null;

    return this.mapPrismaToUsuario(usuario);
  }

  // Create new user
  async create(data: {
    correo: string;
    contrasena: string; // Already hashed
    rol: UserRole;
    nombre: string;
  }): Promise<Usuario> {
    const nuevoUsuario = await prisma.usuario.create({
      data: {
        correo: data.correo.toLowerCase(),
        contrasena: data.contrasena,
        rol: data.rol === 'admin' ? 'ADMIN' : 'PROMOTOR',
        nombre: data.nombre,
      },
    });

    return this.mapPrismaToUsuario(nuevoUsuario);
  }

  // Get all users
  async getAll(): Promise<UsuarioResponse[]> {
    const usuarios = await prisma.usuario.findMany({
      orderBy: { fechaCreacion: 'desc' },
    });

    return usuarios.map(u => this.sanitizeUser(this.mapPrismaToUsuario(u)));
  }

  // Get users by role
  async getByRole(rol: UserRole): Promise<UsuarioResponse[]> {
    const usuarios = await prisma.usuario.findMany({
      where: { rol: rol === 'admin' ? 'ADMIN' : 'PROMOTOR' },
      orderBy: { fechaCreacion: 'desc' },
    });

    return usuarios.map(u => this.sanitizeUser(this.mapPrismaToUsuario(u)));
  }

  // Update user
  async update(id: string, data: Partial<Omit<Usuario, 'id' | 'fechaCreacion'>>): Promise<Usuario | null> {
    // If updating email, check it's not taken
    if (data.correo) {
      const existing = await prisma.usuario.findFirst({
        where: {
          correo: data.correo.toLowerCase(),
          NOT: { id },
        },
      });

      if (existing) {
        throw new Error('El correo ya está registrado');
      }
    }

    const updatedUsuario = await prisma.usuario.update({
      where: { id },
      data: {
        ...(data.correo && { correo: data.correo.toLowerCase() }),
        ...(data.nombre && { nombre: data.nombre }),
        ...(data.rol && { rol: data.rol === 'admin' ? 'ADMIN' : 'PROMOTOR' }),
        ...(data.contrasena && { contrasena: data.contrasena }),
      },
    });

    return this.mapPrismaToUsuario(updatedUsuario);
  }

  // Delete user
  async delete(id: string): Promise<boolean> {
    try {
      await prisma.usuario.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }

  // Remove password from user object
  sanitizeUser(usuario: Usuario): UsuarioResponse {
    const { contrasena, ...userWithoutPassword } = usuario;
    return userWithoutPassword;
  }

  // Map Prisma model to legacy Usuario type
  private mapPrismaToUsuario(prismaUsuario: any): Usuario {
    return {
      id: prismaUsuario.id,
      correo: prismaUsuario.correo,
      contrasena: prismaUsuario.contrasena,
      rol: prismaUsuario.rol === 'ADMIN' ? 'admin' : 'promotor',
      nombre: prismaUsuario.nombre,
      fechaCreacion: prismaUsuario.fechaCreacion.toISOString(),
      tokenVersion: prismaUsuario.tokenVersion,
    };
  }
}

export const usuarioModel = new UsuarioModel();
