import { prisma } from '../config/database.prisma';
import { BotExecution, BotExecutionEstado } from '../types';

export class BotExecutionModel {
  // Get bot execution by ID
  async findById(id: string): Promise<BotExecution | null> {
    const botExecution = await prisma.botExecution.findUnique({
      where: { id },
    });

    return botExecution ? this.mapPrismaToBotExecution(botExecution) : null;
  }

  // Get all bot executions
  async getAll(): Promise<BotExecution[]> {
    const botExecutions = await prisma.botExecution.findMany({
      orderBy: { fechaInicio: 'desc' },
    });

    return botExecutions.map(be => this.mapPrismaToBotExecution(be));
  }

  // Get in-progress execution
  async getInProgress(): Promise<BotExecution | null> {
    const botExecution = await prisma.botExecution.findFirst({
      where: { estado: 'EN_PROGRESO' },
    });

    return botExecution ? this.mapPrismaToBotExecution(botExecution) : null;
  }

  // Get latest execution
  async getLatest(): Promise<BotExecution | null> {
    const botExecutions = await prisma.botExecution.findMany({
      orderBy: { fechaInicio: 'desc' },
      take: 1,
    });

    return botExecutions.length > 0 ? this.mapPrismaToBotExecution(botExecutions[0]) : null;
  }

  // Create new bot execution
  async create(ejecutadoPor: string): Promise<BotExecution> {
    // Check if there's already an execution in progress
    const inProgress = await this.getInProgress();
    if (inProgress) {
      throw new Error('Ya hay una ejecución del bot en progreso');
    }

    const nuevaEjecucion = await prisma.botExecution.create({
      data: {
        ejecutadoPor,
        fechaInicio: new Date(),
        estado: 'EN_PROGRESO',
        logs: ['Iniciando ejecución del bot...'],
      },
    });

    return this.mapPrismaToBotExecution(nuevaEjecucion);
  }

  // Update bot execution
  async update(
    id: string,
    data: Partial<Omit<BotExecution, 'id' | 'fechaInicio' | 'ejecutadoPor'>>
  ): Promise<BotExecution | null> {
    try {
      const prismaData: any = {};
      if (data.fechaFin !== undefined) prismaData.fechaFin = data.fechaFin ? new Date(data.fechaFin) : null;
      if (data.estado !== undefined) prismaData.estado = this.mapEstadoToPrisma(data.estado);
      if (data.totalTramites !== undefined) prismaData.totalTramites = data.totalTramites;
      if (data.completados !== undefined) prismaData.completados = data.completados;
      if (data.errores !== undefined) prismaData.errores = data.errores;
      if (data.logs !== undefined) prismaData.logs = data.logs;

      const updatedBotExecution = await prisma.botExecution.update({
        where: { id },
        data: prismaData,
      });

      return this.mapPrismaToBotExecution(updatedBotExecution);
    } catch {
      return null;
    }
  }

  // Add log message
  async addLog(id: string, message: string): Promise<BotExecution | null> {
    const botExecution = await this.findById(id);
    if (!botExecution) {
      return null;
    }

    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;

    return this.update(id, {
      logs: [...botExecution.logs, logEntry],
    });
  }

  // Increment counters
  async incrementCompletados(id: string): Promise<BotExecution | null> {
    const botExecution = await this.findById(id);
    if (!botExecution) {
      return null;
    }

    return this.update(id, {
      completados: botExecution.completados + 1,
    });
  }

  async incrementErrores(id: string): Promise<BotExecution | null> {
    const botExecution = await this.findById(id);
    if (!botExecution) {
      return null;
    }

    return this.update(id, {
      errores: botExecution.errores + 1,
    });
  }

  // Set total trámites
  async setTotalTramites(id: string, total: number): Promise<BotExecution | null> {
    return this.update(id, {
      totalTramites: total,
    });
  }

  // Mark as completed
  async markAsCompleted(id: string): Promise<BotExecution | null> {
    const botExecution = await this.findById(id);
    if (!botExecution) {
      return null;
    }

    return this.update(id, {
      fechaFin: new Date().toISOString(),
      estado: 'completado',
      logs: [...botExecution.logs, '[SISTEMA] Ejecución completada exitosamente'],
    });
  }

  // Mark as failed
  async markAsFailed(id: string, error: string): Promise<BotExecution | null> {
    const botExecution = await this.findById(id);
    if (!botExecution) {
      return null;
    }

    return this.update(id, {
      fechaFin: new Date().toISOString(),
      estado: 'fallido',
      logs: [...botExecution.logs, `[SISTEMA] Ejecución fallida: ${error}`],
    });
  }

  // Mark as cancelled
  async markAsCancelled(id: string): Promise<BotExecution | null> {
    const botExecution = await this.findById(id);
    if (!botExecution) {
      return null;
    }

    return this.update(id, {
      fechaFin: new Date().toISOString(),
      estado: 'cancelado',
      logs: [...botExecution.logs, '[SISTEMA] Ejecución cancelada'],
    });
  }

  // Delete bot execution
  async delete(id: string): Promise<boolean> {
    try {
      await prisma.botExecution.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }

  // Get stats
  async getStats() {
    const botExecutions = await prisma.botExecution.findMany();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayExecutions = botExecutions.filter(be => be.fechaInicio >= today);

    return {
      totalHoy: todayExecutions.length,
      completadasHoy: todayExecutions.filter(be => be.estado === 'COMPLETADO').length,
      fallidasHoy: todayExecutions.filter(be => be.estado === 'CANCELADO').length,
      enProgreso: botExecutions.filter(be => be.estado === 'EN_PROGRESO').length,
    };
  }

  // Map Prisma model to legacy BotExecution type
  private mapPrismaToBotExecution(prismaBotExecution: any): BotExecution {
    return {
      id: prismaBotExecution.id,
      fechaInicio: prismaBotExecution.fechaInicio.toISOString(),
      fechaFin: prismaBotExecution.fechaFin?.toISOString() || null,
      estado: this.mapPrismaEstadoToLegacy(prismaBotExecution.estado),
      totalTramites: prismaBotExecution.totalTramites,
      completados: prismaBotExecution.completados,
      errores: prismaBotExecution.errores,
      logs: prismaBotExecution.logs,
      ejecutadoPor: prismaBotExecution.ejecutadoPor,
    };
  }

  // Map legacy estado to Prisma enum
  private mapEstadoToPrisma(estado: BotExecutionEstado): any {
    const map: Record<string, any> = {
      en_progreso: 'EN_PROGRESO',
      completado: 'COMPLETADO',
      fallido: 'CANCELADO',
      cancelado: 'CANCELADO',
    };
    return map[estado] || 'PENDIENTE';
  }

  // Map Prisma enum to legacy estado
  private mapPrismaEstadoToLegacy(estado: any): BotExecutionEstado {
    const map: Record<string, BotExecutionEstado> = {
      PENDIENTE: 'en_progreso' as any,
      EN_PROGRESO: 'en_progreso',
      COMPLETADO: 'completado',
      CANCELADO: 'fallido',
    };
    return map[estado] || 'en_progreso';
  }
}

export const botExecutionModel = new BotExecutionModel();
