import { Database } from '../types';
export declare class DatabaseManager {
    private dbPath;
    constructor(dbPath?: string);
    read(): Database;
    write(data: Database): void;
    getUsuarios(): import("../types").Usuario[];
    getCampanas(): import("../types").Campana[];
    getTramites(): import("../types").Tramite[];
    getBotLogs(): import("../types").BotLog[];
    getDevices(): import("../types").Device[];
    getBotExecutions(): import("../types").BotExecution[];
    updateUsuarios(usuarios: any[]): void;
    updateCampanas(campanas: any[]): void;
    updateTramites(tramites: any[]): void;
    updateBotLogs(botLogs: any[]): void;
    updateDevices(devices: any[]): void;
    updateBotExecutions(botExecutions: any[]): void;
}
export declare const db: DatabaseManager;
//# sourceMappingURL=database.d.ts.map