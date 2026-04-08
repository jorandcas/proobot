import { CrearTramiteRequest } from '../types';
export declare class ValidationError extends Error {
    constructor(message: string);
}
export declare class TramiteValidator {
    static validateDN(dn: string): void;
    static validateCURP(curp: string): void;
    static validateTelefono(telefono: string): void;
    static validateEmail(email: string): void;
    static validateFechaNacimiento(fecha: string): void;
    static validateNIP(nip: string): void;
    static validateICC(icc: string): string;
    static validateFVCFecha(fecha: string): void;
    static validateTramite(data: CrearTramiteRequest): void;
    static validatePartial(data: Partial<CrearTramiteRequest>): void;
    static sanitizeTramite(data: CrearTramiteRequest): CrearTramiteRequest;
}
//# sourceMappingURL=tramite.validator.d.ts.map