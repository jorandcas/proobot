export type UserRole = 'admin' | 'promotor';
export type TramiteEstado = 'pendiente' | 'procesando' | 'completado' | 'error' | 'cancelado';
export type TramiteEstadoVista = 'pendiente' | 'en_proceso' | 'completado';
export type DeviceStatus = 'available' | 'busy' | 'offline';
export interface Usuario {
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
    usuario: Usuario;
}
export interface Campana {
    id: string;
    nombre: string;
    fecha: string;
    fechaInicio: string;
    fechaFin: string;
    activa: boolean;
    createdAt: string;
    stats?: {
        total: number;
        pendiente: number;
        procesando: number;
        completado: number;
        error: number;
        cancelado: number;
    };
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
    genero: 'Masculino' | 'Femenino';
    email?: string;
    fechaNacimiento: string;
    campanaNombre: string;
    promotorNombre: string;
    estadoVista?: TramiteEstadoVista;
}
export interface CrearTramiteRequest {
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
    genero: 'Masculino' | 'Femenino';
    email?: string;
    fechaNacimiento: string;
}
export interface FVCDateOption {
    fecha: string;
    indice: number;
    label: string;
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
    estado: 'en_progreso' | 'completado' | 'fallido' | 'cancelado';
    totalTramites: number;
    completados: number;
    errores: number;
    logs: string[];
    ejecutadoPor: string;
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
//# sourceMappingURL=index.d.ts.map