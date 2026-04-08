import axios, { AxiosError } from 'axios';
import { useToast } from '../context/ToastContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Retry configuration
interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryCondition?: (error: AxiosError) => boolean;
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  retryCondition: (error: AxiosError) => {
    // Retry on network errors or 5xx errors
    return !error.response || (error.response.status >= 500 && error.response.status < 600);
  },
};

// Sleep function for retry delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry logic with exponential backoff
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  config: RetryConfig = defaultRetryConfig
): Promise<T> => {
  let lastError: any;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if condition doesn't match
      if (!config.retryCondition || !config.retryCondition(error as AxiosError)) {
        throw error;
      }

      // Don't retry after last attempt
      if (attempt < config.maxRetries) {
        const delay = config.retryDelay * Math.pow(2, attempt); // Exponential backoff
        console.log(`Retry attempt ${attempt + 1}/${config.maxRetries} after ${delay}ms`);
        await sleep(delay);
      }
    }
  }

  throw lastError;
};

// Error messages mapping
const getErrorMessage = (error: any): string => {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }

  if (error.response?.status) {
    const status = error.response.status;
    switch (status) {
      case 400:
        return 'Datos inválidos. Por favor verifica la información.';
      case 401:
        return 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.';
      case 403:
        return 'No tienes permiso para realizar esta acción.';
      case 404:
        return 'El recurso solicitado no existe.';
      case 500:
        return 'Error del servidor. Por favor intenta nuevato.';
      case 503:
        return 'El servicio no está disponible. Por favor intenta más tarde.';
      default:
        return `Error (${status}): ${error.message}`;
    }
  }

  if (error.code === 'ECONNABORTED') {
    return 'La conexión tardó demasiado. Por favor verifica tu internet.';
  }

  if (error.code === 'ERR_NETWORK') {
    return 'Error de conexión. Por favor verifica tu internet.';
  }

  return error.message || 'Ocurrió un error inesperado.';
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and retries
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse>) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Don't retry on client errors (4xx)
    if (error.response && error.response.status >= 400 && error.response.status < 500) {
      return Promise.reject(error);
    }

    // Retry on network errors or 5xx
    return retryWithBackoff(
      () => Promise.reject(error),
      {
        ...defaultRetryConfig,
        retryCondition: (err) => {
          // Retry on network errors or 5xx
          return !err.response || (err.response.status >= 500 && err.response.status < 600);
        },
      }
    );
  }
);

// API methods with toast integration
export const apiService = {
  // Auth
  login: (correo: string, contrasena: string) =>
    api.post<ApiResponse<{ token: string; usuario: any }>>('/auth/login', {
      correo,
      contrasena,
    }),

  getMe: () => api.get<ApiResponse<any>>('/auth/me'),
  changePassword: (contrasenaActual: string, contrasenaNueva: string) =>
    api.post<ApiResponse>('/auth/change-password', {
      contrasenaActual,
      contrasenaNueva,
    }),
  revokeSession: (usuarioId: string) =>
    api.post<ApiResponse>(`/auth/revoke-session/${usuarioId}`),
  getAllUsers: () => api.get<ApiResponse<any[]>>('/auth/users'),

  // Campañas
  getCampanas: () => api.get<ApiResponse<any[]>>('/campanas'),
  getActiveCampanas: () => api.get<ApiResponse<any[]>>('/campanas/active'),
  getCampanasWithTramites: () => api.get<ApiResponse<any[]>>('/campanas/with-tramites'),
  getCampanaById: (id: string) => api.get<ApiResponse<any>>(`/campanas/${id}`),

  // Trámites
  getTramites: (params?: {
    estado?: string;
    idCampana?: string;
    search?: string;
  }) => api.get<ApiResponse<any[]>>('/tramites', { params }),
  getTramiteById: (id: string) => api.get<ApiResponse<any>>(`/tramites/${id}`),
  createTramite: (data: any) => api.post<ApiResponse<any>>('/tramites', data),
  cancelTramite: (id: string) => api.put<ApiResponse<any>>(`/tramites/${id}/cancel`),
  resetTramite: (id: string) => api.put<ApiResponse<any>>(`/tramites/${id}/reset`),
  corregirTramite: (id: string, data: any) => api.put<ApiResponse<any>>(`/tramites/${id}/corregir`, data),
  getFVCFechas: () => api.get<ApiResponse<any[]>>('/tramites/fvc/fechas'),

  // Dashboard
  getPromotorStats: () => api.get<ApiResponse<any>>('/dashboard/promotor'),
  getAdminStats: () => api.get<ApiResponse<any>>('/dashboard/admin'),
  getRecentTramites: (limit?: number) =>
    api.get<ApiResponse<any[]>>('/dashboard/recent', { params: { limit } }),
  getTramitesByCampana: (idCampana: string) =>
    api.get<ApiResponse<any[]>>(`/dashboard/campana/${idCampana}`),

  // Bot (admin only)
  executeBot: (maxTramites?: number) =>
    api.post<ApiResponse<{ ejecucionId: string; totalTramites: number }>>('/bot/execute', {
      maxTramites,
    }),
  cancelBot: () =>
    api.post<ApiResponse<{ ejecucionId: string }>>('/bot/cancel'),
  getBotStatus: () => api.get<ApiResponse<any>>('/bot/status'),
  getBotHistory: () => api.get<ApiResponse<any[]>>('/bot/history'),
  getBotExecution: (id: string) => api.get<ApiResponse<any>>(`/bot/execution/${id}`),
  getDevices: () => api.get<ApiResponse<any>>('/bot/devices'),
  addDevice: (udid: string, name: string) =>
    api.post<ApiResponse<any>>('/bot/devices', { udid, name }),
  deleteDevice: (id: string) => api.delete<ApiResponse>(`/bot/devices/${id}`),
};

// Helper function to handle API calls with toasts
export const withToast = async <T>(
  apiCall: Promise<T>,
  toast: ReturnType<typeof useToast>,
  options?: {
    successMessage?: string;
    errorMessage?: string;
  }
): Promise<T> => {
  try {
    const result = await apiCall;
    if (options?.successMessage) {
      toast.showSuccess(options.successMessage);
    }
    return result;
  } catch (error: any) {
    const message = options?.errorMessage || getErrorMessage(error);
    toast.showError(message);
    throw error;
  }
};

export { getErrorMessage };
export default api;
