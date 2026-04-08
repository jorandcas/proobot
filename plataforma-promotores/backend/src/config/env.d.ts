interface EnvConfig {
    port: number;
    nodeEnv: string;
    jwtSecret: string;
    jwtExpiresIn: string;
    adminEmail: string;
    adminPassword: string;
    adminName: string;
    botTimeout: number;
    botRetryAttempts: number;
    botRetryDelay: number;
    dbPath: string;
}
declare const config: EnvConfig;
export default config;
//# sourceMappingURL=env.d.ts.map