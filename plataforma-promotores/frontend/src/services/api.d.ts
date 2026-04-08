import { useToast } from '../context/ToastContext';
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
declare const getErrorMessage: (error: any) => string;
declare const api: import("axios").AxiosInstance;
export declare const apiService: {
    login: (correo: string, contrasena: string) => Promise<import("axios").AxiosResponse<ApiResponse<{
        token: string;
        usuario: any;
    }>, any, {}>>;
    getMe: () => Promise<import("axios").AxiosResponse<ApiResponse<any>, any, {}>>;
    changePassword: (contrasenaActual: string, contrasenaNueva: string) => Promise<import("axios").AxiosResponse<ApiResponse<any>, any, {}>>;
    revokeSession: (usuarioId: string) => Promise<import("axios").AxiosResponse<ApiResponse<any>, any, {}>>;
    getAllUsers: () => Promise<import("axios").AxiosResponse<ApiResponse<any[]>, any, {}>>;
    getCampanas: () => Promise<import("axios").AxiosResponse<ApiResponse<any[]>, any, {}>>;
    getActiveCampanas: () => Promise<import("axios").AxiosResponse<ApiResponse<any[]>, any, {}>>;
    getCampanasWithTramites: () => Promise<import("axios").AxiosResponse<ApiResponse<any[]>, any, {}>>;
    getCampanaById: (id: string) => Promise<import("axios").AxiosResponse<ApiResponse<any>, any, {}>>;
    getTramites: (params?: {
        estado?: string;
        idCampana?: string;
        search?: string;
    }) => Promise<import("axios").AxiosResponse<ApiResponse<any[]>, any, {}>>;
    getTramiteById: (id: string) => Promise<import("axios").AxiosResponse<ApiResponse<any>, any, {}>>;
    createTramite: (data: any) => Promise<import("axios").AxiosResponse<ApiResponse<any>, any, {}>>;
    cancelTramite: (id: string) => Promise<import("axios").AxiosResponse<ApiResponse<any>, any, {}>>;
    resetTramite: (id: string) => Promise<import("axios").AxiosResponse<ApiResponse<any>, any, {}>>;
    corregirTramite: (id: string, data: any) => Promise<import("axios").AxiosResponse<ApiResponse<any>, any, {}>>;
    getFVCFechas: () => Promise<import("axios").AxiosResponse<ApiResponse<any[]>, any, {}>>;
    getPromotorStats: () => Promise<import("axios").AxiosResponse<ApiResponse<any>, any, {}>>;
    getAdminStats: () => Promise<import("axios").AxiosResponse<ApiResponse<any>, any, {}>>;
    getRecentTramites: (limit?: number) => Promise<import("axios").AxiosResponse<ApiResponse<any[]>, any, {}>>;
    getTramitesByCampana: (idCampana: string) => Promise<import("axios").AxiosResponse<ApiResponse<any[]>, any, {}>>;
    executeBot: (maxTramites?: number) => Promise<import("axios").AxiosResponse<ApiResponse<{
        ejecucionId: string;
        totalTramites: number;
    }>, any, {}>>;
    cancelBot: () => Promise<import("axios").AxiosResponse<ApiResponse<{
        ejecucionId: string;
    }>, any, {}>>;
    getBotStatus: () => Promise<import("axios").AxiosResponse<ApiResponse<any>, any, {}>>;
    getBotHistory: () => Promise<import("axios").AxiosResponse<ApiResponse<any[]>, any, {}>>;
    getBotExecution: (id: string) => Promise<import("axios").AxiosResponse<ApiResponse<any>, any, {}>>;
    getDevices: () => Promise<import("axios").AxiosResponse<ApiResponse<any>, any, {}>>;
    addDevice: (udid: string, name: string) => Promise<import("axios").AxiosResponse<ApiResponse<any>, any, {}>>;
    deleteDevice: (id: string) => Promise<import("axios").AxiosResponse<ApiResponse<any>, any, {}>>;
};
export declare const withToast: <T>(apiCall: Promise<T>, toast: ReturnType<typeof useToast>, options?: {
    successMessage?: string;
    errorMessage?: string;
}) => Promise<T>;
export { getErrorMessage };
export default api;
//# sourceMappingURL=api.d.ts.map