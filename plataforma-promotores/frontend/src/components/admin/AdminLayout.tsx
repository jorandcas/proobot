import React from 'react';
import { AdminSidebar } from './AdminSidebar';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  // Verificar que sea admin
  if (usuario?.rol !== 'admin') {
    navigate('/login');
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white/80 backdrop-blur-lg shadow-md px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Bienvenido, {usuario?.nombre}
              </h2>
              <p className="text-sm text-slate-600 font-medium">Admin</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500 font-medium">
                {new Date().toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
