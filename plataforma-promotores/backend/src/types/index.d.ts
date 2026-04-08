export type UserRole = 'admin' | 'promotor';
export type TramiteEstado = 'pendiente' | 'procesando' | 'completado' | 'error' | 'cancelado';
export type BotExecutionEstado = 'en_progreso' | 'completado' | 'fallido' | 'cancelado';
export type DeviceStatus = 'available' | 'busy' | 'offline';
export type Genero = 'Masculino' | 'Femenino';
export interface Usuario {
    id: string;
    correo: string;
    contrasena: string;
    rol: UserRole;
    nombre: string;
    fechaCreacion: string;
    tokenVersion?: number;
}
export interface UsuarioResponse {
    id: string;
    correo: string;
    rol: UserRole;
    nombre: string;
    fechaCreacion: string;
}
export interface LoginRequest {
    correo: string;
    contrasena: string;
}
export interface LoginResponse {
    token: string;
    usuario: UsuarioResponse;
}
export interface Campana {
    id: string;
    nombre: string;
    fecha: string;
    fechaInicio: string;
    fechaFin: string;
    activa: boolean;
    createdAt: string;
}
export interface Tramite {
    id: string;
    idCampana: string;
    idPromotor: string;
    fechaCreacion: string;
    estado: TramiteEstado;
    fechaProcesamiento: string | null;
    resultado: string | null;
    botLogId: string | null;
    mensajeCorreccion?: string | null;
    dn: string;
    icc: string;
    fvcFecha: string;
    nip: string;
    nombre: string;
    nombreSegundo?: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    curp: string;
    telefono: string;
    telefono2?: string;
    genero: Genero;
    email?: string;
    fechaNacimiento?: string;
}
export interface CrearTramiteRequest {
    dn: string;
    icc: string;
    fvcFecha: string;
    nip: string;
    nombre: string;
    nombreSegundo?: string;
    apellidoPaterno: string;
    apellidoMaterno?: string;
    curp: string;
    telefono: string;
    telefono2?: string;
    genero: Genero;
    email?: string;
    fechaNacimiento: string;
}
export interface TramiteResponse extends Tramite {
    campanaNombre: string;
    promotorNombre: string;
}
export interface BotLog {
    id: string;
    idTramite: string;
    idDevice: string;
    fechaInicio: string;
    fechaFin: string | null;
    estado: BotExecutionEstado;
    logs: string[];
    error: string | null;
}
export interface Device {
    id: string;
    udid: string;
    name: string;
    status: DeviceStatus;
    lastUsed: string | null;
    createdAt: string;
}
export interface BotExecution {
    id: string;
    fechaInicio: string;
    fechaFin: string | null;
    estado: BotExecutionEstado;
    totalTramites: number;
    completados: number;
    errores: number;
    logs: string[];
    ejecutadoPor: string;
}
export interface EjecutarBotRequest {
    maxTramites?: number;
}
export interface DashboardPromotorStats {
    totalHoy: number;
    totalSemana: number;
    totalMes: number;
    porEstado: {
        pendiente: number;
        procesando: number;
        completado: number;
        error: number;
        cancelado: number;
    };
}
export interface DashboardAdminStats {
    tramitesPendientes: number;
    devicesAvailable: number;
    devicesBusy: number;
    devicesOffline: number;
    tramitesHoy: number;
    tramitesSemana: number;
    tramitesMes: number;
    exitoHoy: number;
    erroresHoy: number;
    ultimaEjecucion: BotExecution | null;
    promotoresActivos: number;
}
export interface Database {
    usuarios: Usuario[];
    campanas: Campana[];
    tramites: Tramite[];
    botLogs: BotLog[];
    devices: Device[];
    botExecutions: BotExecution[];
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
export interface PaginationParams {
    page?: number;
    limit?: number;
}
export interface TramiteFilters {
    estado?: TramiteEstado;
    idCampana?: string;
    idPromotor?: string;
    fechaDesde?: string;
    fechaHasta?: string;
    search?: string;
}
//# sourceMappingURL=index.d.ts.map