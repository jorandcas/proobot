import { BotLog, BotExecutionEstado } from '../types';
export declare class BotLogModel {
    findById(id: string): BotLog | null;
    getAll(): BotLog[];
    getByTramiteId(idTramite: string): BotLog[];
    getByDeviceId(idDevice: string): BotLog[];
    getByEstado(estado: BotExecutionEstado): BotLog[];
    create(data: {
        idTramite: string;
        idDevice: string;
    }): BotLog;
    update(id: string, data: Partial<Omit<BotLog, 'id' | 'idTramite' | 'idDevice' | 'fechaInicio'>>): BotLog | null;
    addLog(id: string, message: string): BotLog | null;
    markAsCompleted(id: string): BotLog | null;
    markAsFailed(id: string, error: string): BotLog | null;
    markAsCancelled(id: string): BotLog | null;
    delete(id: string): boolean;
}
export declare const botLogModel: BotLogModel;
//# sourceMappingURL=botLog.model.d.ts.map