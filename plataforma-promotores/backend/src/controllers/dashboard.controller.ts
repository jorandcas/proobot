import { Request, Response } from 'express';
import { tramiteModel } from '../models/tramite.model';
import { deviceModel } from '../models/device.model';
import { botExecutionModel } from '../models/botExecution.model';
import { usuarioModel } from '../models/usuario.model';
import { DashboardPromotorStats, DashboardAdminStats } from '../types';

export class DashboardController {
  // Get promotor dashboard stats
  static async getPromotorStats(req: Request, res: Response): Promise<void> {
    try {
      if (!req.usuario) {
        res.status(401).json({
          success: false,
          error: 'No autenticado',
        });
        return;
      }

      const stats = await tramiteModel.getPromotorStats(req.usuario.id);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Error obteniendo estadísticas del promotor:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      });
    }
  }

  // Get admin dashboard stats
  static async getAdminStats(req: Request, res: Response): Promise<void> {
    try {
      const tramitesStats = await tramiteModel.getGlobalStats();
      const deviceStats = await deviceModel.getStats();
      const botExecutionStats = await botExecutionModel.getStats();
      const ultimaEjecucion = await botExecutionModel.getLatest();
      const promotores = await usuarioModel.getByRole('promotor');
      const promotoresActivos = promotores.length;

      const stats: DashboardAdminStats = {
        tramitesPendientes: tramitesStats.tramitesPendientes,
        devicesAvailable: deviceStats.available,
        devicesBusy: deviceStats.busy,
        devicesOffline: deviceStats.offline,
        tramitesHoy: tramitesStats.tramitesHoy,
        tramitesSemana: tramitesStats.tramitesSemana,
        tramitesMes: tramitesStats.tramitesMes,
        exitoHoy: tramitesStats.exitoHoy,
        erroresHoy: tramitesStats.erroresHoy,
        ultimaEjecucion,
        promotoresActivos,
      };

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Error obteniendo estadísticas del admin:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      });
    }
  }

  // Get recent trámites (for dashboard table)
  static async getRecentTramites(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      let tramites;

      // If promotor, use filtered view (hide technical errors, translate states)
      if (req.usuario?.rol === 'promotor') {
        tramites = await tramiteModel.getForPromotor(req.usuario.id);
      } else {
        // Admin sees all
        tramites = await tramiteModel.getAllWithResponse();
      }

      // Get only the most recent
      const recentTramites = tramites.slice(0, limit);

      res.json({
        success: true,
        data: recentTramites,
      });
    } catch (error) {
      console.error('Error obteniendo trámites recientes:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      });
    }
  }

  // Get trámites by campaign (for dashboard)
  static async getTramitesByCampana(req: Request, res: Response): Promise<void> {
    try {
      const { idCampana } = req.params;

      // If promotor, use filtered view (hide technical errors, translate states)
      if (req.usuario?.rol === 'promotor') {
        const tramites = await tramiteModel.getForPromotor(req.usuario.id, { idCampana });
        res.json({
          success: true,
          data: tramites,
        });
      } else {
        // Admin sees all
        const tramites = await tramiteModel.getAllWithResponse({ idCampana });
        res.json({
          success: true,
          data: tramites,
        });
      }
    } catch (error) {
      console.error('Error obteniendo trámites por campaña:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      });
    }
  }
}
