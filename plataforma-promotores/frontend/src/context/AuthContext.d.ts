import React, { ReactNode } from 'react';
import { Usuario, LoginRequest } from '../types';
interface AuthContextType {
    usuario: Usuario | null;
    login: (credentials: LoginRequest) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
}
export declare const useAuth: () => AuthContextType;
interface AuthProviderProps {
    children: ReactNode;
}
export declare const AuthProvider: React.FC<AuthProviderProps>;
export {};
//# sourceMappingURL=AuthContext.d.ts.map