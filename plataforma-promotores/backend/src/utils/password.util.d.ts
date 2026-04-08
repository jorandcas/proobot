export declare class PasswordUtil {
    static hash(password: string): Promise<string>;
    static compare(password: string, hash: string): Promise<boolean>;
    static generateRandom(length?: number): string;
}
//# sourceMappingURL=password.util.d.ts.map