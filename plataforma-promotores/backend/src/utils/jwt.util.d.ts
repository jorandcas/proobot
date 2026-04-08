export interface JwtPayload {
    usuarioId: string;
    correo: string;
    rol: string;
    tokenVersion?: number;
}
export declare class JwtUtil {
    static generateToken(payload: JwtPayload): string;
    static verifyToken(token: string): JwtPayload;
    static decodeToken(token: string): JwtPayload | null;
}
//# sourceMappingURL=jwt.util.d.ts.map