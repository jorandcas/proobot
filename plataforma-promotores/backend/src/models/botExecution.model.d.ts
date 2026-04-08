import { BotExecution } from '../types';
export declare class BotExecutionModel {
    findById(id: string): BotExecution | null;
    getAll(): BotExecution[];
    getInProgress(): BotExecution | null;
    getLatest(): BotExecution | null;
    create(ejecutadoPor: string): BotExecution;
    update(id: string, data: Partial<Omit<BotExecution, 'id' | 'fechaInicio' | 'ejecutadoPor'>>): BotExecution | null;
    addLog(id: string, message: string): BotExecution | null;
    incrementCompletados(id: string): BotExecution | null;
    incrementErrores(id: string): BotExecution | null;
    setTotalTramites(id: string, total: number): BotExecution | null;
    markAsCompleted(id: string): BotExecution | null;
    markAsFailed(id: string, error: string): BotExecution | null;
    markAsCancelled(id: string): BotExecution | null;
    delete(id: string): boolean;
    getStats(): {
        totalHoy: number;
        completadasHoy: number;
        fallidasHoy: number;
        enProgreso: number;
    };
}
export declare const botExecutionModel: BotExecutionModel;
//# sourceMappingURL=botExecution.model.d.ts.map