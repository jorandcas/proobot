import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '📊',
    path: '/admin/dashboard',
  },
  {
    id: 'tramites',
    label: 'Trámites',
    icon: '📋',
    path: '/admin/tramites',
  },
  {
    id: 'bot',
    label: 'Control Bot',
    icon: '🤖',
    path: '/admin/bot',
  },
  {
    id: 'promotores',
    label: 'Promotores',
    icon: '👥',
    path: '/admin/promotores',
  },
];

export const AdminSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white min-h-screen flex flex-col border-r border-slate-700">
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Panel Admin</h1>
        <p className="text-sm text-slate-400 mt-1">Gestión de Plataforma</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-semibold">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            navigate('/login');
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 font-semibold"
        >
          <span className="text-xl">🚪</span>
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};
