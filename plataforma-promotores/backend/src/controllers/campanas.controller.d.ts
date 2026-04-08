import { Request, Response } from 'express';
export declare class CampanasController {
    static getAll(req: Request, res: Response): Promise<void>;
    static getActive(req: Request, res: Response): Promise<void>;
    static getWithTramites(req: Request, res: Response): Promise<void>;
    static getById(req: Request, res: Response): Promise<void>;
    static create(req: Request, res: Response): Promise<void>;
    static update(req: Request, res: Response): Promise<void>;
    static delete(req: Request, res: Response): Promise<void>;
    static ensureToday(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=campanas.controller.d.ts.map