import { Request, Response } from 'express';
export declare class BotController {
    static execute(req: Request, res: Response): Promise<void>;
    private static executeAsync;
    static getStatus(req: Request, res: Response): Promise<void>;
    static cancel(req: Request, res: Response): Promise<void>;
    static getHistory(req: Request, res: Response): Promise<void>;
    static getExecutionById(req: Request, res: Response): Promise<void>;
    static getDevices(req: Request, res: Response): Promise<void>;
    static addDevice(req: Request, res: Response): Promise<void>;
    static deleteDevice(req: Request, res: Response): Promise<void>;
    static getTramiteLogs(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=bot.controller.d.ts.map