import { Request, Response } from 'express';
import { campanaModel } from '../models/campana.model';

export class CampanasController {
  // Get all campaigns
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const campanas = await campanaModel.getAll();

      res.json({
        success: true,
        data: campanas,
      });
    } catch (error) {
      console.error('Error obteniendo campañas:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      });
    }
  }

  // Get active campaigns
  static async getActive(req: Request, res: Response): Promise<void> {
    try {
      const campanas = await campanaModel.getActive();

      res.json({
        success: true,
        data: campanas,
      });
    } catch (error) {
      console.error('Error obteniendo campañas activas:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      });
    }
  }

  // Get campaigns that have trámites
  static async getWithTramites(req: Request, res: Response): Promise<void> {
    try {
      // If promotor, only get their campaigns
      const idPromotor = req.usuario?.rol === 'promotor' ? req.usuario.id : undefined;
      const campanas = await campanaModel.getWithTramites(idPromotor);

      res.json({
        success: true,
        data: campanas,
      });
    } catch (error) {
      console.error('Error obteniendo campañas con trámites:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      });
    }
  }

  // Get campaign by ID with stats
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const campana = await campanaModel.getWithStats(id);

      if (!campana) {
        res.status(404).json({
          success: false,
          error: 'Campaña no encontrada',
        });
        return;
      }

      res.json({
        success: true,
        data: campana,
      });
    } catch (error) {
      console.error('Error obteniendo campaña:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      });
    }
  }

  // Create new campaign (admin only)
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { nombre, fecha, activa } = req.body;

      if (!nombre || !fecha) {
        res.status(400).json({
          success: false,
          error: 'Nombre y fecha son obligatorios',
        });
        return;
      }

      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(fecha)) {
        res.status(400).json({
          success: false,
          error: 'La fecha debe tener el formato YYYY-MM-DD',
        });
        return;
      }

      const nuevaCampana = await campanaModel.create({
        nombre,
        fecha,
        activa,
      });

      res.status(201).json({
        success: true,
        data: nuevaCampana,
        message: 'Campaña creada exitosamente',
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      console.error('Error creando campaña:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      });
    }
  }

  // Update campaign (admin only)
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { nombre, activa } = req.body;

      const campana = await campanaModel.update(id, { nombre, activa });

      if (!campana) {
        res.status(404).json({
          success: false,
          error: 'Campaña no encontrada',
        });
        return;
      }

      res.json({
        success: true,
        data: campana,
        message: 'Campaña actualizada exitosamente',
      });
    } catch (error) {
      console.error('Error actualizando campaña:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      });
    }
  }

  // Delete campaign (admin only)
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const deleted = await campanaModel.delete(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Campaña no encontrada',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Campaña eliminada exitosamente',
      });
    } catch (error) {
      console.error('Error eliminando campaña:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      });
    }
  }

  // Ensure today's campaign exists (internal use)
  static async ensureToday(req: Request, res: Response): Promise<void> {
    try {
      const campana = await campanaModel.ensureTodayCampaign();

      res.json({
        success: true,
        data: campana,
        message: 'Campaña de hoy asegurada',
      });
    } catch (error) {
      console.error('Error asegurando campaña de hoy:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      });
    }
  }
}
