import { Request, Response } from 'express';
export declare class AuthController {
    static login(req: Request, res: Response): Promise<void>;
    static me(req: Request, res: Response): Promise<void>;
    static createUser(req: Request, res: Response): Promise<void>;
    static initAdmin(req: Request, res: Response): Promise<void>;
    static changePassword(req: Request, res: Response): Promise<void>;
    static getAllUsers(req: Request, res: Response): Promise<void>;
    static revokeSession(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=auth.controller.d.ts.map