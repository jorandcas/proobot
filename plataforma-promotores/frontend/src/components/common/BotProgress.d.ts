import React from 'react';
interface BotProgressProps {
    ejecutando: boolean;
    ejecucion?: {
        id: string;
        totalTramites: number;
        completados: number;
        errores: number;
        progreso: number;
        logs?: string[];
        currentTramite?: string;
    } | null;
}
export declare const BotProgress: React.FC<BotProgressProps>;
export {};
//# sourceMappingURL=BotProgress.d.ts.map