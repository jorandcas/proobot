import { prisma } from '../config/database.prisma';
import { BotLog, BotExecutionEstado } from '../types';

export class BotLogModel {
  // Get bot log by ID
  async findById(id: string): Promise<BotLog | null> {
    const botLog = await prisma.botLog.findUnique({
      where: { id },
    });

    return botLog ? this.mapPrismaToBotLog(botLog) : null;
  }

  // Get all bot logs
  async getAll(): Promise<BotLog[]> {
    const botLogs = await prisma.botLog.findMany({
      orderBy: { fechaInicio: 'desc' },
    });

    return botLogs.map(bl => this.mapPrismaToBotLog(bl));
  }

  // Get logs by trámite ID
  async getByTramiteId(idTramite: string): Promise<BotLog[]> {
    const botLogs = await prisma.botLog.findMany({
      where: { idTramite },
      orderBy: { fechaInicio: 'desc' },
    });

    return botLogs.map(bl => this.mapPrismaToBotLog(bl));
  }

  // Get logs by device ID
  async getByDeviceId(idDevice: string): Promise<BotLog[]> {
    const botLogs = await prisma.botLog.findMany({
      where: { idDevice },
      orderBy: { fechaInicio: 'desc' },
    });

    return botLogs.map(bl => this.mapPrismaToBotLog(bl));
  }

  // Get logs by estado
  async getByEstado(estado: BotExecutionEstado): Promise<BotLog[]> {
    const botLogs = await prisma.botLog.findMany({
      where: { estado: this.mapEstadoToPrisma(estado) },
    });

    return botLogs.map(bl => this.mapPrismaToBotLog(bl));
  }

  // Create new bot log
  async create(data: { idTramite: string; idDevice: string }): Promise<BotLog> {
    const nuevoBotLog = await prisma.botLog.create({
      data: {
        idTramite: data.idTramite,
        idDevice: data.idDevice,
        fechaInicio: new Date(),
        fechaFin: new Date(), // Will be updated later
        estado: 'EXITOSO', // Default, will be updated
        logs: [],
      },
    });

    return this.mapPrismaToBotLog(nuevoBotLog);
  }

  // Update bot log
  async update(
    id: string,
    data: Partial<Omit<BotLog, 'id' | 'idTramite' | 'idDevice' | 'fechaInicio'>>
  ): Promise<BotLog | null> {
    try {
      const prismaData: any = {};
      if (data.fechaFin !== undefined) prismaData.fechaFin = data.fechaFin ? new Date(data.fechaFin) : new Date();
      if (data.estado !== undefined) prismaData.estado = this.mapEstadoToPrisma(data.estado);
      if (data.logs !== undefined) prismaData.logs = data.logs;
      if (data.error !== undefined) prismaData.error = data.error;

      const updatedBotLog = await prisma.botLog.update({
        where: { id },
        data: prismaData,
      });

      return this.mapPrismaToBotLog(updatedBotLog);
    } catch {
      return null;
    }
  }

  // Add log message
  async addLog(id: string, message: string): Promise<BotLog | null> {
    const botLog = await this.findById(id);
    if (!botLog) {
      return null;
    }

    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;

    return this.update(id, {
      logs: [...botLog.logs, logEntry],
    });
  }

  // Mark as completed
  async markAsCompleted(id: string): Promise<BotLog | null> {
    return this.update(id, {
      fechaFin: new Date().toISOString(),
      estado: 'completado',
    });
  }

  // Mark as failed
  async markAsFailed(id: string, error: string): Promise<BotLog | null> {
    return this.update(id, {
      fechaFin: new Date().toISOString(),
      estado: 'fallido',
      error,
    });
  }

  // Mark as cancelled
  async markAsCancelled(id: string): Promise<BotLog | null> {
    return this.update(id, {
      fechaFin: new Date().toISOString(),
      estado: 'cancelado',
    });
  }

  // Delete bot log
  async delete(id: string): Promise<boolean> {
    try {
      await prisma.botLog.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }

  // Map Prisma model to legacy BotLog type
  private mapPrismaToBotLog(prismaBotLog: any): BotLog {
    return {
      id: prismaBotLog.id,
      idTramite: prismaBotLog.idTramite,
      idDevice: prismaBotLog.idDevice,
      fechaInicio: prismaBotLog.fechaInicio.toISOString(),
      fechaFin: prismaBotLog.fechaFin.toISOString(),
      estado: this.mapPrismaEstadoToLegacy(prismaBotLog.estado),
      logs: prismaBotLog.logs,
      error: prismaBotLog.error,
    };
  }

  // Map legacy estado to Prisma enum
  private mapEstadoToPrisma(estado: BotExecutionEstado): any {
    const map: Record<BotExecutionEstado, any> = {
      en_progreso: 'EN_PROGRESO',
      completado: 'EXITOSO',
      fallido: 'FALLIDO',
      cancelado: 'CANCELADO',
    };
    return map[estado] || 'EN_PROGRESO';
  }

  // Map Prisma enum to legacy estado
  private mapPrismaEstadoToLegacy(estado: any): BotExecutionEstado {
    const map: Record<string, BotExecutionEstado> = {
      EN_PROGRESO: 'en_progreso',
      EXITOSO: 'completado',
      FALLIDO: 'fallido',
    };
    return map[estado] || 'en_progreso';
  }
}

export const botLogModel = new BotLogModel();
