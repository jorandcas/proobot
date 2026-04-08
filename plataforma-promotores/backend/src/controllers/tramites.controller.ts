import { Request, Response } from 'express';
import { tramiteModel } from '../models/tramite.model';
import { TramiteValidator, ValidationError } from '../validators/tramite.validator';
import { TramiteFilters, CrearTramiteRequest } from '../types';
import { FVCUtil } from '../utils/fvc.util';

export class TramitesController {
  // Get all trámites (with filters)
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const {
        estado,
        idCampana,
        idPromotor,
        fechaDesde,
        fechaHasta,
        search,
      } = req.query;

      const filters: TramiteFilters = {};

      if (estado) filters.estado = estado as any;
      if (idCampana) filters.idCampana = idCampana as string;
      if (idPromotor) filters.idPromotor = idPromotor as string;
      if (fechaDesde) filters.fechaDesde = fechaDesde as string;
      if (fechaHasta) filters.fechaHasta = fechaHasta as string;
      if (search) filters.search = search as string;

      // If user is promotor, only show their trámites with translated states
      if (req.usuario?.rol === 'promotor') {
        const tramites = await tramiteModel.getForPromotor(req.usuario.id, filters);
        res.json({
          success: true,
          data: tramites,
        });
        return;
      }

      const tramites = await tramiteModel.getAllWithResponse(filters);

      res.json({
        success: true,
        data: tramites,
      });
    } catch (error) {
      console.error('Error obteniendo trámites:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      });
    }
  }

  // Get trámite by ID
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const tramite = await tramiteModel.findById(id);

      if (!tramite) {
        res.status(404).json({
          success: false,
          error: 'Trámite no encontrado',
        });
        return;
      }

      // Check permissions: promotor can only see their own trámites
      if (req.usuario?.rol === 'promotor' && tramite.idPromotor !== req.usuario.id) {
        res.status(403).json({
          success: false,
          error: 'No tienes permiso para ver este trámite',
        });
        return;
      }

      // For promotores, use filtered view (hide technical errors, translate states)
      // For admins, use full response
      let tramiteConDatos;
      if (req.usuario?.rol === 'promotor') {
        const tramites = await tramiteModel.getForPromotor(tramite.idPromotor);
        tramiteConDatos = tramites.find(t => t.id === id);
      } else {
        const tramites = await tramiteModel.getAllWithResponse({ idPromotor: tramite.idPromotor });
        tramiteConDatos = tramites.find(t => t.id === id);
      }

      res.json({
        success: true,
        data: tramiteConDatos,
      });
    } catch (error) {
      console.error('Error obteniendo trámite:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      });
    }
  }

  // Create new trámite
  static async create(req: Request, res: Response): Promise<void> {
    try {
      if (!req.usuario) {
        res.status(401).json({
          success: false,
          error: 'No autenticado',
        });
        return;
      }

      const data: CrearTramiteRequest = req.body;

      // Validate
      TramiteValidator.validateTramite(data);

      // Sanitize
      const sanitizedData = TramiteValidator.sanitizeTramite(data);

      // Create trámite
      const nuevoTramite = await tramiteModel.create(sanitizedData, req.usuario.id);

      console.log('✅ Trámite creado en BD:', nuevoTramite.id);

      // Get full response
      const tramites = await tramiteModel.getAllWithResponse();
      const tramiteConDatos = tramites.find(t => t.id === nuevoTramite.id);

      if (!tramiteConDatos) {
        console.error('❌ ERROR: Trámite se creó pero no se encontró en getAllWithResponse:', nuevoTramite.id);
        res.status(500).json({
          success: false,
          error: 'Error al recuperar el trámite creado',
        });
        return;
      }

      console.log('✅ Trámite recuperado con éxito:', tramiteConDatos.nombre, tramiteConDatos.dn);

      res.status(201).json({
        success: true,
        data: tramiteConDatos,
        message: 'Trámite creado exitosamente',
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      // Handle ICC duplicate error
      if (error instanceof Error && error.message.includes('ICC ya está siendo utilizado')) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      console.error('Error creando trámite:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      });
    }
  }

  // Update trámite (admin only - for manual corrections)
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = req.body;

      const tramite = await tramiteModel.update(id, data);

      if (!tramite) {
        res.status(404).json({
          success: false,
          error: 'Trámite no encontrado',
        });
        return;
      }

      res.json({
        success: true,
        data: tramite,
        message: 'Trámite actualizado exitosamente',
      });
    } catch (error) {
      console.error('Error actualizando trámite:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      });
    }
  }

  // Cancel trámite
  static async cancel(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const tramite = await tramiteModel.findById(id);

      if (!tramite) {
        res.status(404).json({
          success: false,
          error: 'Trámite no encontrado',
        });
        return;
      }

      // Check permissions: promotor can only cancel their own pending trámites
      if (req.usuario?.rol === 'promotor') {
        if (tramite.idPromotor !== req.usuario.id) {
          res.status(403).json({
            success: false,
            error: 'No tienes permiso para cancelar este trámite',
          });
          return;
        }

        if (tramite.estado !== 'pendiente') {
          res.status(400).json({
            success: false,
            error: 'Solo se pueden cancelar trámites en estado pendiente',
          });
          return;
        }
      }

      const cancelledTramite = await tramiteModel.cancel(id);

      res.json({
        success: true,
        data: cancelledTramite,
        message: 'Trámite cancelado exitosamente',
      });
    } catch (error) {
      console.error('Error cancelando trámite:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      });
    }
  }

  // Reset trámite from error to pending (admin only)
  static async resetToPending(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const tramite = await tramiteModel.findById(id);

      if (!tramite) {
        res.status(404).json({
          success: false,
          error: 'Trámite no encontrado',
        });
        return;
      }

      // Only allow resetting error trámites
      if (tramite.estado !== 'error') {
        res.status(400).json({
          success: false,
          error: 'Solo se pueden reiniciar trámites en estado error',
        });
        return;
      }

      const resetTramite = await tramiteModel.resetToPending(id);

      res.json({
        success: true,
        data: resetTramite,
        message: 'Trámite reiniciado exitosamente',
      });
    } catch (error) {
      console.error('Error reiniciando trámite:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      });
    }
  }

  // Delete trámite (admin only)
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const deleted = await tramiteModel.delete(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Trámite no encontrado',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Trámite eliminado exitosamente',
      });
    } catch (error) {
      console.error('Error eliminando trámite:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      });
    }
  }

  // Get pending trámites (for bot processing - admin only)
  static async getPending(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

      const tramites = await tramiteModel.getPendingForProcessing(limit);

      res.json({
        success: true,
        data: tramites,
        count: tramites.length,
      });
    } catch (error) {
      console.error('Error obteniendo trámites pendientes:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      });
    }
  }

  // Get FVC available dates
  static async getFVCFechas(req: Request, res: Response): Promise<void> {
    try {
      const fechas = FVCUtil.getFVCFechasDisponibles();

      res.json({
        success: true,
        data: fechas,
      });
    } catch (error) {
      console.error('Error obteniendo fechas FVC:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      });
    }
  }

  // Update trámite and retry (for promotor correction)
  static async updateAndRetry(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      let updates = req.body;

      // Convert empty strings to undefined for optional fields
      if (updates.email === '') updates.email = undefined;
      if (updates.nombreSegundo === '') updates.nombreSegundo = undefined;
      if (updates.telefono2 === '') updates.telefono2 = undefined;

      // Verify trámite exists
      const tramite = await tramiteModel.findById(id);

      if (!tramite) {
        res.status(404).json({
          success: false,
          error: 'Trámite no encontrado',
        });
        return;
      }

      // Check permissions: promotor can only update their own trámites
      if (req.usuario?.rol === 'promotor' && tramite.idPromotor !== req.usuario.id) {
        res.status(403).json({
          success: false,
          error: 'No tienes permiso para modificar este trámite',
        });
        return;
      }

      // Validate updated data
      try {
        TramiteValidator.validatePartial(updates);
      } catch (error) {
        if (error instanceof ValidationError) {
          res.status(400).json({
            success: false,
            error: error.message,
          });
          return;
        }
        throw error;
      }

      // Update trámite and reset to pending
      const tramiteActualizado = await tramiteModel.updateAndRetry(id, updates);

      if (!tramiteActualizado) {
        res.status(404).json({
          success: false,
          error: 'Trámite no encontrado',
        });
        return;
      }

      res.json({
        success: true,
        data: tramiteActualizado,
        message: 'Trámite actualizado y puesto en cola para reprocesar',
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      // Handle ICC duplicate error
      if (error instanceof Error && error.message.includes('ICC ya está siendo utilizado')) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      console.error('Error actualizando trámite:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      });
    }
  }
}
