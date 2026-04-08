import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            usuario?: {
                id: string;
                correo: string;
                rol: string;
            };
        }
    }
}
export declare const authMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const adminMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const promotorMiddleware: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.middleware.d.ts.map