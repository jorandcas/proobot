import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Usuario, LoginRequest } from '../types';
import { apiService } from '../services/api';

interface AuthContextType {
  usuario: Usuario | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUsuario = localStorage.getItem('usuario');

      if (token && storedUsuario) {
        try {
          // Verify token is still valid
          const response = await apiService.getMe();
          if (response.data.success && response.data.data) {
            setUsuario(response.data.data);
          } else {
            // Token invalid, clear storage
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('usuario');
        }
      }

      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      const response = await apiService.login(
        credentials.correo,
        credentials.contrasena
      );

      if (response.data.success && response.data.data) {
        const { token, usuario: usuarioData } = response.data.data;

        localStorage.setItem('token', token);
        localStorage.setItem('usuario', JSON.stringify(usuarioData));
        setUsuario(usuarioData);
      } else {
        throw new Error(response.data.error || 'Login failed');
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || 'Error al iniciar sesión';
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);
  };

  const value: AuthContextType = {
    usuario,
    login,
    logout,
    isAuthenticated: !!usuario,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
