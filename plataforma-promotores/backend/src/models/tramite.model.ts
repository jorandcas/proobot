import { prisma } from '../config/database.prisma';
import { campanaModel } from './campana.model';
import { Tramite, CrearTramiteRequest, TramiteResponse, TramiteEstado, TramiteFilters } from '../types';

export class TramiteModel {
  // Get trámite by ID
  async findById(id: string): Promise<Tramite | null> {
    const tramite = await prisma.tramite.findUnique({
      where: { id },
    });

    return tramite ? this.mapPrismaToTramite(tramite) : null;
  }

  // Get all trámites with optional filters
  async getAll(filters?: TramiteFilters): Promise<Tramite[]> {
    const where: any = {};

    if (filters) {
      // Filter by estado
      if (filters.estado) {
        where.estado = this.mapEstadoToPrisma(filters.estado);
      }

      // Filter by campaña
      if (filters.idCampana) {
        where.idCampana = filters.idCampana;
      }

      // Filter by promotor
      if (filters.idPromotor) {
        where.idPromotor = filters.idPromotor;
      }

      // Filter by date range
      if (filters.fechaDesde || filters.fechaHasta) {
        where.fechaCreacion = {};
        if (filters.fechaDesde) {
          where.fechaCreacion.gte = new Date(filters.fechaDesde);
        }
        if (filters.fechaHasta) {
          where.fechaCreacion.lte = new Date(filters.fechaHasta);
        }
      }

      // Search by DN, nombre, CURP
      if (filters.search) {
        where.OR = [
          { dn: { contains: filters.search, mode: 'insensitive' } },
          { nombre: { contains: filters.search, mode: 'insensitive' } },
          { curp: { contains: filters.search, mode: 'insensitive' } },
        ];
      }
    }

    const tramites = await prisma.tramite.findMany({
      where,
      orderBy: { fechaCreacion: 'desc' },
    });

    return tramites.map(t => this.mapPrismaToTramite(t));
  }

  // Get trámites with full response (includes related data)
  async getAllWithResponse(filters?: TramiteFilters): Promise<TramiteResponse[]> {
    const tramites = await this.getAll(filters);

    const campanaIds = [...new Set(tramites.map(t => t.idCampana))];
    const promotorIds = [...new Set(tramites.map(t => t.idPromotor))];

    const campanas = await prisma.campana.findMany({
      where: { id: { in: campanaIds } },
    });

    const usuarios = await prisma.usuario.findMany({
      where: { id: { in: promotorIds } },
    });

    return tramites.map(tramite => {
      const campana = campanas.find(c => c.id === tramite.idCampana);
      const promotor = usuarios.find(u => u.id === tramite.idPromotor);

      return {
        ...tramite,
        campanaNombre: campana?.nombre || 'Campaña eliminada',
        promotorNombre: promotor?.nombre || 'Promotor eliminado',
      };
    });
  }

  // Get trámites for bot processing (pendiente, ordered by fechaCreacion ASC)
  async getPendingForProcessing(limit?: number): Promise<Tramite[]> {
    const tramites = await prisma.tramite.findMany({
      where: { estado: 'PENDIENTE' },
      orderBy: { fechaCreacion: 'asc' },
      ...(limit && { take: limit }),
    });

    return tramites.map(t => this.mapPrismaToTramite(t));
  }

  // Check if ICC is already in use (excluding cancelled/completed trámites)
  async isICCInUse(icc: string, excludeTramiteId?: string): Promise<boolean> {
    console.log(`🔍 [ICC CHECK] Verificando ICC: ${icc}`);
    const duplicateICC = await prisma.tramite.findFirst({
      where: {
        icc,
        ...(excludeTramiteId && { id: { not: excludeTramiteId } }),
        estado: { in: ['PENDIENTE', 'PROCESANDO', 'ERROR'] },
      },
    });

    if (duplicateICC) {
      console.log(`⛔ [ICC CHECK] ICC OCUPADO por trámite ID: ${duplicateICC.id}, Estado: ${duplicateICC.estado}`);
    } else {
      console.log(`✅ [ICC CHECK] ICC DISPONIBLE`);
    }

    return !!duplicateICC;
  }

  // Create new trámite
  async create(data: CrearTramiteRequest, idPromotor: string): Promise<Tramite> {
    console.log(`📝 [CREATE] Intentando crear trámite para DN: ${data.dn}, ICC: ${data.icc}`);

    // Check if ICC is already in use
    if (await this.isICCInUse(data.icc)) {
      console.log(`❌ [CREATE] ICC bloqueado, rechazando creación`);
      throw new Error('El ICC ya está siendo utilizado en otro trámite activo. Por favor, verifica el código de barras de la SIM.');
    }

    console.log(`✅ [CREATE] ICC disponible, procediendo a crear trámite`);

    // Ensure today's campaign exists
    const campana = await campanaModel.ensureTodayCampaign();

    const nuevoTramite = await prisma.tramite.create({
      data: {
        idCampana: campana.id,
        idPromotor,
        estado: 'PENDIENTE',

        // Búsqueda Porta
        dn: data.dn,
        icc: data.icc,
        fvcFecha: data.fvcFecha,

        // Sección Línea
        nip: data.nip,

        // Datos Personales
        nombre: data.nombre,
        nombreSegundo: data.nombreSegundo,
        apellidoPaterno: data.apellidoPaterno,
        apellidoMaterno: data.apellidoMaterno || 'R',
        curp: data.curp,
        telefono: data.telefono,
        telefono2: data.telefono2,
        genero: data.genero,
        email: data.email,
        fechaNacimiento: data.fechaNacimiento,
      },
    });

    return this.mapPrismaToTramite(nuevoTramite);
  }

  // Update trámite
  async update(
    id: string,
    data: Partial<Omit<Tramite, 'id' | 'idCampana' | 'idPromotor' | 'fechaCreacion'>>
  ): Promise<Tramite | null> {
    try {
      // Map estado if present
      const prismaData: any = { ...data };
      if (data.estado) {
        prismaData.estado = this.mapEstadoToPrisma(data.estado);
      }

      const updatedTramite = await prisma.tramite.update({
        where: { id },
        data: prismaData,
      });

      return this.mapPrismaToTramite(updatedTramite);
    } catch {
      return null;
    }
  }

  // Update trámite estado
  async updateEstado(id: string, estado: TramiteEstado): Promise<Tramite | null> {
    return this.update(id, {
      estado,
      fechaProcesamiento: estado === 'procesando' ? new Date().toISOString() : null,
    });
  }

  // Mark as processing
  async markAsProcessing(id: string): Promise<Tramite | null> {
    return this.updateEstado(id, 'procesando');
  }

  // Mark as completed
  async markAsCompleted(id: string, resultado: string, botLogId: string): Promise<Tramite | null> {
    return this.update(id, {
      estado: 'completado',
      resultado: `exito: ${resultado}`,
      botLogId,
    });
  }

  // Mark as error (technical error - keep as pending for retry)
  async markAsError(id: string, error: string, botLogId: string): Promise<Tramite | null> {
    // Don't update botLogId for technical errors - keep it retryable
    await prisma.tramite.update({
      where: { id },
      data: {
        estado: 'PENDIENTE', // Keep as pending so it can be retried
      },
    });

    return this.findById(id);
  }

  // Mark as error requiring user correction
  async markAsErrorWithCorrection(id: string, error: string, botLogId: string, mensajeCorreccion: string): Promise<Tramite | null> {
    return this.update(id, {
      estado: 'error',
      resultado: `error: ${error}`,
      botLogId,
      mensajeCorreccion,
    });
  }

  // Update trámite data and reset to pending
  async updateAndRetry(
    id: string,
    updates: Partial<Omit<Tramite, 'id' | 'idCampana' | 'idPromotor' | 'fechaCreacion'>>
  ): Promise<Tramite | null> {
    // Check if ICC is being changed and if new ICC is already in use
    if (updates.icc) {
      const current = await this.findById(id);
      if (current && updates.icc !== current.icc) {
        if (await this.isICCInUse(updates.icc, id)) {
          throw new Error('El ICC ya está siendo utilizado en otro trámite activo. Por favor, verifica el código de barras de la SIM.');
        }
      }
    }

    await prisma.tramite.update({
      where: { id },
      data: {
        ...updates,
        estado: 'PENDIENTE',
        fechaProcesamiento: null,
        resultado: null,
        botLogId: null,
        mensajeCorreccion: null,
      },
    });

    return this.findById(id);
  }

  // Cancel trámite
  async cancel(id: string): Promise<Tramite | null> {
    return this.updateEstado(id, 'cancelado');
  }

  // Reset trámite from error to pending
  async resetToPending(id: string): Promise<Tramite | null> {
    await prisma.tramite.update({
      where: { id },
      data: {
        estado: 'PENDIENTE',
        fechaProcesamiento: null,
        resultado: null,
        botLogId: null,
        mensajeCorreccion: null,
      },
    });

    return this.findById(id);
  }

  // Delete trámite
  async delete(id: string): Promise<boolean> {
    try {
      await prisma.tramite.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }

  // Get stats for a promotor
  async getPromotorStats(idPromotor: string) {
    const tramites = await prisma.tramite.findMany({
      where: { idPromotor },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    return {
      totalHoy: tramites.filter(t => t.fechaCreacion >= today).length,
      totalSemana: tramites.filter(t => t.fechaCreacion >= weekAgo).length,
      totalMes: tramites.filter(t => t.fechaCreacion >= monthAgo).length,
      porEstado: {
        pendiente: tramites.filter(t => t.estado === 'PENDIENTE').length,
        procesando: tramites.filter(t => t.estado === 'PROCESANDO').length,
        completado: tramites.filter(t => t.estado === 'COMPLETADO').length,
        error: tramites.filter(t => t.estado === 'ERROR').length,
        cancelado: tramites.filter(t => t.estado === 'CANCELADO').length,
      },
    };
  }

  // Get global stats
  async getGlobalStats() {
    const tramites = await prisma.tramite.findMany();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const todayTramites = tramites.filter(t => t.fechaCreacion >= today);

    return {
      tramitesPendientes: tramites.filter(t => t.estado === 'PENDIENTE').length,
      tramitesHoy: todayTramites.length,
      tramitesSemana: tramites.filter(t => t.fechaCreacion >= weekAgo).length,
      tramitesMes: tramites.filter(t => t.fechaCreacion >= monthAgo).length,
      exitoHoy: todayTramites.filter(t => t.estado === 'COMPLETADO').length,
      erroresHoy: todayTramites.filter(t => t.estado === 'ERROR').length,
      procesandoHoy: todayTramites.filter(t => t.estado === 'PROCESANDO').length,
    };
  }

  // Get trámites for promotor view (with translated states)
  async getForPromotor(
    idPromotor: string,
    filters?: TramiteFilters
  ): Promise<Array<Partial<Tramite> & { estadoVista: 'pendiente' | 'en_proceso' | 'completado' }>> {
    const where: any = { idPromotor };

    if (filters) {
      if (filters.estado) {
        where.estado = this.mapEstadoToPrisma(filters.estado);
      }
      if (filters.idCampana) {
        where.idCampana = filters.idCampana;
      }
      if (filters.fechaDesde || filters.fechaHasta) {
        where.fechaCreacion = {};
        if (filters.fechaDesde) {
          where.fechaCreacion.gte = new Date(filters.fechaDesde);
        }
        if (filters.fechaHasta) {
          where.fechaCreacion.lte = new Date(filters.fechaHasta);
        }
      }
      if (filters.search) {
        where.OR = [
          { dn: { contains: filters.search, mode: 'insensitive' } },
          { nombre: { contains: filters.search, mode: 'insensitive' } },
          { curp: { contains: filters.search, mode: 'insensitive' } },
        ];
      }
    }

    // Exclude cancelled and technical errors
    where.estado = { in: ['PENDIENTE', 'PROCESANDO', 'COMPLETADO', 'ERROR'] };

    const tramites = await prisma.tramite.findMany({
      where,
      orderBy: { fechaCreacion: 'desc' },
    });

    // Get bot logs to check which errors have mensajeCorreccion
    const tramiteIds = tramites.map(t => t.id);
    const botLogs = await prisma.botLog.findMany({
      where: { idTramite: { in: tramiteIds } },
    });

    const botLogsWithMensaje = new Set(
      botLogs.filter(bl => bl.error && bl.error.includes('mensajeCorreccion')).map(bl => bl.idTramite)
    );

    return tramites
      .filter(tramite => {
        // Hide technical errors (those without mensajeCorreccion in bot logs)
        if (tramite.estado === 'ERROR' && !botLogsWithMensaje.has(tramite.id)) {
          return false;
        }
        return true;
      })
      .map(tramite => {
        const mappedTramite = this.mapPrismaToTramite(tramite);
        let estadoVista: 'pendiente' | 'en_proceso' | 'completado' = 'pendiente'; // Default value

        if (tramite.estado === 'COMPLETADO') {
          estadoVista = 'completado';
        } else if (tramite.estado === 'PROCESANDO') {
          estadoVista = 'en_proceso';
        } else if (tramite.estado === 'PENDIENTE') {
          estadoVista = 'pendiente';
        } else if (tramite.estado === 'ERROR') {
          estadoVista = 'en_proceso';
        }

        // Remove technical fields
        const { resultado, botLogId, ...tramiteLimpio } = mappedTramite;

        return {
          ...tramiteLimpio,
          estadoVista,
        };
      });
  }

  // Map legacy estado to Prisma enum
  private mapEstadoToPrisma(estado: TramiteEstado): any {
    const map: Record<TramiteEstado, any> = {
      pendiente: 'PENDIENTE',
      procesando: 'PROCESANDO',
      completado: 'COMPLETADO',
      error: 'ERROR',
      cancelado: 'CANCELADO',
    };
    return map[estado];
  }

  // Map Prisma model to legacy Tramite type
  private mapPrismaToTramite(prismaTramite: any): Tramite {
    return {
      id: prismaTramite.id,
      idCampana: prismaTramite.idCampana,
      idPromotor: prismaTramite.idPromotor,
      fechaCreacion: prismaTramite.fechaCreacion.toISOString(),
      estado: this.mapPrismaEstadoToLegacy(prismaTramite.estado),
      fechaProcesamiento: prismaTramite.fechaProcesamiento?.toISOString() || null,
      dn: prismaTramite.dn,
      rfc: prismaTramite.rfc,
      requestId: prismaTramite.requestId,
      icc: prismaTramite.icc,
      nip: prismaTramite.nip,
      fvcIndice: prismaTramite.fvcIndice,
      fvcFecha: prismaTramite.fvcFecha,
      nombre: prismaTramite.nombre,
      nombreSegundo: prismaTramite.nombreSegundo,
      apellidoPaterno: prismaTramite.apellidoPaterno,
      apellidoMaterno: prismaTramite.apellidoMaterno,
      curp: prismaTramite.curp,
      telefono: prismaTramite.telefono,
      telefono2: prismaTramite.telefono2,
      genero: prismaTramite.genero,
      email: prismaTramite.email,
      fechaNacimiento: prismaTramite.fechaNacimiento,
      resultado: prismaTramite.resultado,
      botLogId: prismaTramite.botLogId,
      mensajeCorreccion: prismaTramite.mensajeCorreccion,
    };
  }

  // Map Prisma enum to legacy estado
  private mapPrismaEstadoToLegacy(estado: any): TramiteEstado {
    const map: Record<string, TramiteEstado> = {
      PENDIENTE: 'pendiente',
      PROCESANDO: 'procesando',
      COMPLETADO: 'completado',
      ERROR: 'error',
      CANCELADO: 'cancelado',
    };
    return map[estado] || 'pendiente';
  }
}

export const tramiteModel = new TramiteModel();
