import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { DashboardPromotor } from './pages/DashboardPromotor';

import { FormTramite } from './pages/FormTramite';
import { EditarTramite } from './pages/EditarTramite';
import { AdminLayout } from './components/admin/AdminLayout';
import { DashboardOverview } from './pages/admin/DashboardOverview';
import { BotControl } from './pages/admin/BotControl';
import { PromotoresManagement } from './pages/admin/PromotoresManagement';
import { TramitesManagement } from './pages/admin/TramitesManagement';

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: 'admin' | 'promotor' }> = ({
  children,
  requiredRole,
}) => {
  const { isAuthenticated, isLoading, usuario } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Cargando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && usuario?.rol !== requiredRole && usuario?.rol !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  if (requiredRole === 'admin' && usuario?.rol !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Promotor routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPromotor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tramites/nuevo"
        element={
          <ProtectedRoute>
            <FormTramite />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tramites/:id/editar"
        element={
          <ProtectedRoute>
            <EditarTramite />
          </ProtectedRoute>
        }
      />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <Navigate to="/admin/dashboard" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout>
              <DashboardOverview />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/tramites"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout>
              <TramitesManagement />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/bot"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout>
              <BotControl />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/promotores"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout>
              <PromotoresManagement />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
