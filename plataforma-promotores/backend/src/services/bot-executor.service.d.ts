import { Tramite } from '../types';
interface BotExecutionResult {
    success: boolean;
    error?: string;
    logs?: string[];
}
export declare class BotExecutorService {
    executeTramite(tramite: Tramite): Promise<BotExecutionResult>;
    private runBotScript;
    executeBatch(tramites: Tramite[], onProgress?: (current: number, total: number, tramite: Tramite, botLogs?: string[]) => void): Promise<{
        success: number;
        errors: number;
        results: Array<{
            tramiteId: string;
            success: boolean;
            error?: string;
            botLogId?: string;
        }>;
    }>;
    private esErrorDeDatos;
}
export declare const botExecutorService: BotExecutorService;
export {};
//# sourceMappingURL=bot-executor.service.d.ts.map