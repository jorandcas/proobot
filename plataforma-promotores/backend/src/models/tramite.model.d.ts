import { Tramite, CrearTramiteRequest, TramiteResponse, TramiteEstado, TramiteFilters } from '../types';
export declare class TramiteModel {
    findById(id: string): Tramite | null;
    getAll(filters?: TramiteFilters): Tramite[];
    getAllWithResponse(filters?: TramiteFilters): TramiteResponse[];
    getPendingForProcessing(limit?: number): Tramite[];
    isICCInUse(icc: string, excludeTramiteId?: string): boolean;
    create(data: CrearTramiteRequest, idPromotor: string): Tramite;
    update(id: string, data: Partial<Omit<Tramite, 'id' | 'idCampana' | 'idPromotor' | 'fechaCreacion'>>): Tramite | null;
    updateEstado(id: string, estado: TramiteEstado): Tramite | null;
    markAsProcessing(id: string): Tramite | null;
    markAsCompleted(id: string, resultado: string, botLogId: string): Tramite | null;
    markAsError(id: string, error: string, botLogId: string): Tramite | null;
    markAsErrorWithCorrection(id: string, error: string, botLogId: string, mensajeCorreccion: string): Tramite | null;
    updateAndRetry(id: string, updates: Partial<Omit<Tramite, 'id' | 'idCampana' | 'idPromotor' | 'fechaCreacion'>>): Tramite | null;
    cancel(id: string): Tramite | null;
    resetToPending(id: string): Tramite | null;
    delete(id: string): boolean;
    getPromotorStats(idPromotor: string): {
        totalHoy: number;
        totalSemana: number;
        totalMes: number;
        porEstado: {
            pendiente: number;
            procesando: number;
            completado: number;
            error: number;
            cancelado: number;
        };
    };
    getGlobalStats(): {
        tramitesPendientes: number;
        tramitesHoy: number;
        tramitesSemana: number;
        tramitesMes: number;
        exitoHoy: number;
        erroresHoy: number;
        procesandoHoy: number;
    };
    getForPromotor(idPromotor: string, filters?: TramiteFilters): Array<Partial<Tramite> & {
        estadoVista: 'pendiente' | 'en_proceso' | 'completado';
    }>;
}
export declare const tramiteModel: TramiteModel;
//# sourceMappingURL=tramite.model.d.ts.map