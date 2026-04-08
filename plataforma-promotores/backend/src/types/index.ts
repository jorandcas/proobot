// ============================================
// TYPES FOR THE PLATFORM
// ============================================

export type UserRole = 'admin' | 'promotor';

export type TramiteEstado = 'pendiente' | 'procesando' | 'completado' | 'error' | 'cancelado';

export type BotExecutionEstado = 'en_progreso' | 'completado' | 'fallido' | 'cancelado';

export type DeviceStatus = 'available' | 'busy' | 'offline';

export type Genero = 'Masculino' | 'Femenino';

// ============================================
// USUARIO
// ============================================
export interface Usuario {
  id: string;
  correo: string;
  contrasena: string; // hashed
  rol: UserRole;
  nombre: string;
  fechaCreacion: string;
  tokenVersion?: number; // Para invalidar sesiones (incrementar para revocar todos los tokens)
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

// ============================================
// CAMPAÑA
// ============================================
export interface Campana {
  id: string;
  nombre: string;
  fecha: string; // YYYY-MM-DD
  fechaInicio: string; // ISO date
  fechaFin: string; // ISO date
  activa: boolean;
  createdAt: string;
}

// ============================================
// TRÁMITE (PORTA)
// ============================================
export interface Tramite {
  id: string;
  idCampana: string;
  idPromotor: string;
  fechaCreacion: string;
  estado: TramiteEstado;
  fechaProcesamiento: string | null;
  resultado: string | null; // 'exito' | 'error: mensaje'
  botLogId: string | null;
  mensajeCorreccion?: string | null; // Mensaje de error cuando el promotor debe corregir datos

  // Búsqueda Porta
  dn: string;
  rfc?: string | null;
  requestId?: string | null;
  icc: string; // Ahora obligatorio
  fvcFecha: string; // Fecha seleccionada (formato DD/MM/YYYY) en lugar de índice
  fvcIndice?: number | null; // Índice de fecha de vencimiento (1-5)

  // Sección Línea
  nip: string;

  // Datos Personales
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
  icc: string; // Ahora obligatorio
  fvcFecha: string; // Fecha seleccionada (formato DD/MM/YYYY)
  nip: string; // Exactamente 4 dígitos
  nombre: string;
  nombreSegundo?: string;
  apellidoPaterno: string;
  apellidoMaterno?: string; // Opcional, se pondrá 'R' por defecto si está vacío
  curp: string;
  telefono: string;
  telefono2?: string;
  genero: Genero;
  email?: string;
  fechaNacimiento: string; // Ahora obligatorio
}

export interface TramiteResponse extends Tramite {
  campanaNombre: string;
  promotorNombre: string;
}

// ============================================
// BOT LOG
// ============================================
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

// ============================================
// DEVICE (DISPOSITIVO)
// ============================================
export interface Device {
  id: string;
  udid: string;
  name: string;
  status: DeviceStatus;
  workerUrl: string;  // URL del bot worker HTTP (ej: http://worker-1.example.com)
  lastUsed: string | null;
  createdAt: string;
}

// ============================================
// BOT EXECUTION (EJECUCIÓN GENERAL)
// ============================================
export interface BotExecution {
  id: string;
  fechaInicio: string;
  fechaFin: string | null;
  estado: BotExecutionEstado;
  totalTramites: number;
  completados: number;
  errores: number;
  logs: string[];
  ejecutadoPor: string; // usuario id
}

export interface EjecutarBotRequest {
  maxTramites?: number; // Opcional: limitar cantidad
}

// ============================================
// DASHBOARD
// ============================================
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

// ============================================
// DATABASE
// ============================================
export interface Database {
  usuarios: Usuario[];
  campanas: Campana[];
  tramites: Tramite[];
  botLogs: BotLog[];
  devices: Device[];
  botExecutions: BotExecution[];
}

// ============================================
// API RESPONSES
// ============================================
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
  search?: string; // buscar por DN, nombre, CURP
}
