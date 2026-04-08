import { prisma } from '../config/database.prisma';
import { Campana } from '../types';

export class CampanaModel {
  // Get campaign by date (YYYY-MM-DD)
  async findByDate(fecha: string): Promise<Campana | null> {
    const campana = await prisma.campana.findFirst({
      where: { fecha: new Date(fecha) },
    });

    return campana ? this.mapPrismaToCampana(campana) : null;
  }

  // Get campaign by ID
  async findById(id: string): Promise<Campana | null> {
    const campana = await prisma.campana.findUnique({
      where: { id },
    });

    return campana ? this.mapPrismaToCampana(campana) : null;
  }

  // Get all campaigns
  async getAll(): Promise<Campana[]> {
    const campanas = await prisma.campana.findMany({
      orderBy: { fecha: 'desc' },
    });

    return campanas.map(c => this.mapPrismaToCampana(c));
  }

  // Get active campaigns
  async getActive(): Promise<Campana[]> {
    const campanas = await prisma.campana.findMany({
      where: { activa: true },
      orderBy: { fecha: 'desc' },
    });

    return campanas.map(c => this.mapPrismaToCampana(c));
  }

  // Create new campaign
  async create(data: {
    nombre: string;
    fecha: string; // YYYY-MM-DD
    activa?: boolean;
  }): Promise<Campana> {
    // Check if campaign for this date already exists
    const existing = await prisma.campana.findFirst({
      where: { fecha: new Date(data.fecha) },
    });

    if (existing) {
      throw new Error(`Ya existe una campaña para la fecha ${data.fecha}`);
    }

    const date = new Date(data.fecha);
    const fechaInicio = new Date(date);
    fechaInicio.setHours(6, 0, 0, 0); // 6:00 AM del día

    const fechaFin = new Date(date);
    fechaFin.setHours(5, 59, 59, 999); // 5:59 AM del día siguiente

    const nuevaCampana = await prisma.campana.create({
      data: {
        nombre: data.nombre,
        fecha: date,
        fechaInicio,
        fechaFin,
        activa: data.activa !== undefined ? data.activa : true,
      },
    });

    return this.mapPrismaToCampana(nuevaCampana);
  }

  // Auto-create campaign for today
  async createForToday(): Promise<Campana> {
    const today = new Date();
    const fechaStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
    const nombre = `Campaña ${fechaStr}`;

    // Check if already exists
    const existing = await this.findByDate(fechaStr);
    if (existing) {
      return existing;
    }

    return this.create({
      nombre,
      fecha: fechaStr,
      activa: true,
    });
  }

  // Ensure campaign exists for today
  async ensureTodayCampaign(): Promise<Campana> {
    const today = new Date();
    const fechaStr = today.toISOString().split('T')[0];

    let campana = await this.findByDate(fechaStr);

    if (!campana) {
      campana = await this.createForToday();
    }

    return campana;
  }

  // Update campaign
  async update(id: string, data: Partial<Omit<Campana, 'id' | 'createdAt'>>): Promise<Campana | null> {
    try {
      const updatedCampana = await prisma.campana.update({
        where: { id },
        data: {
          ...(data.nombre !== undefined && { nombre: data.nombre }),
          ...(data.activa !== undefined && { activa: data.activa }),
        },
      });

      return this.mapPrismaToCampana(updatedCampana);
    } catch {
      return null;
    }
  }

  // Delete campaign
  async delete(id: string): Promise<boolean> {
    try {
      await prisma.campana.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }

  // Get campaign with tramite count
  async getWithStats(id: string): Promise<(Campana & { stats: any }) | null> {
    const campana = await prisma.campana.findUnique({
      where: { id },
      include: {
        tramites: true,
      },
    });

    if (!campana) {
      return null;
    }

    const tramites = campana.tramites;

    const stats = {
      total: tramites.length,
      pendiente: tramites.filter(t => t.estado === 'PENDIENTE').length,
      procesando: tramites.filter(t => t.estado === 'PROCESANDO').length,
      completado: tramites.filter(t => t.estado === 'COMPLETADO').length,
      error: tramites.filter(t => t.estado === 'ERROR').length,
      cancelado: tramites.filter(t => t.estado === 'CANCELADO').length,
    };

    return {
      ...this.mapPrismaToCampana(campana),
      stats,
    };
  }

  // Get campaigns that have trámites (optionally filter by promotor)
  async getWithTramites(idPromotor?: string): Promise<Campana[]> {
    const tramitesWhere = idPromotor ? { idPromotor } : undefined;

    const campanas = await prisma.campana.findMany({
      where: {
        tramites: {
          some: tramitesWhere,
        },
      },
      orderBy: { fecha: 'desc' },
    });

    return campanas.map(c => this.mapPrismaToCampana(c));
  }

  // Map Prisma model to legacy Campana type
  private mapPrismaToCampana(prismaCampana: any): Campana {
    return {
      id: prismaCampana.id,
      nombre: prismaCampana.nombre,
      fecha: prismaCampana.fecha.toISOString().split('T')[0],
      fechaInicio: prismaCampana.fechaInicio.toISOString(),
      fechaFin: prismaCampana.fechaFin.toISOString(),
      activa: prismaCampana.activa,
      createdAt: prismaCampana.createdAt.toISOString(),
    };
  }
}

export const campanaModel = new CampanaModel();
