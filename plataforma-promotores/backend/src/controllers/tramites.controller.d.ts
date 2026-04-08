import { Request, Response } from 'express';
export declare class TramitesController {
    static getAll(req: Request, res: Response): Promise<void>;
    static getById(req: Request, res: Response): Promise<void>;
    static create(req: Request, res: Response): Promise<void>;
    static update(req: Request, res: Response): Promise<void>;
    static cancel(req: Request, res: Response): Promise<void>;
    static resetToPending(req: Request, res: Response): Promise<void>;
    static delete(req: Request, res: Response): Promise<void>;
    static getPending(req: Request, res: Response): Promise<void>;
    static getFVCFechas(req: Request, res: Response): Promise<void>;
    static updateAndRetry(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=tramites.controller.d.ts.map