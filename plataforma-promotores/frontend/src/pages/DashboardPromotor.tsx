import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { DashboardPromotorStats, Tramite, Campana } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { EstadoBadge } from '../components/common/EstadoBadge';
import { StatsCard } from '../components/common/StatsCard';
import { Table } from '../components/common/Table';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

export const DashboardPromotor: React.FC = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardPromotorStats | null>(null);
  const [tramites, setTramites] = useState<Tramite[]>([]);
  const [campanas, setCampanas] = useState<Campana[]>([]);
  const [selectedCampana, setSelectedCampana] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, tramitesRes, campanasRes] = await Promise.all([
        apiService.getPromotorStats(),
        apiService.getRecentTramites(50),
        apiService.getCampanasWithTramites(),
      ]);

      if (statsRes.data.success) setStats(statsRes.data.data);
      if (tramitesRes.data.success) setTramites(tramitesRes.data.data);
      if (campanasRes.data.success) {
        setCampanas(campanasRes.data.data);
        if (campanasRes.data.data.length > 0) {
          setSelectedCampana(campanasRes.data.data[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCampanaChange = async (idCampana: string) => {
    setSelectedCampana(idCampana);
    try {
      const response = await apiService.getTramitesByCampana(idCampana);
      if (response.data.success) {
        setTramites(response.data.data);
      }
    } catch (error) {
      console.error('Error loading trámites by campaña:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Cargando..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Portabilidad</h1>
              <p className="text-xs text-slate-500 mt-0.5">Bienvenido, {usuario?.nombre}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Action Bar */}
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Mis Trámites</h2>
            <p className="text-slate-600 mt-2">Gestiona tus portabilidades</p>
          </div>
          <Button onClick={() => navigate('/tramites/nuevo')}>
            + Nueva Portabilidad
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <StatsCard title="Hoy" value={stats.totalHoy} delay="0s" />
            <StatsCard title="Esta Semana" value={stats.totalSemana} delay="0.1s" />
            <StatsCard title="Este Mes" value={stats.totalMes} delay="0.2s" />
            <StatsCard title="Pendientes" value={stats.porEstado.pendiente} delay="0.3s" />
          </div>
        )}

        {/* Campaign Filter */}
        {campanas.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Filtrar por Campaña
            </label>
            <select
              value={selectedCampana}
              onChange={(e) => handleCampanaChange(e.target.value)}
              className="w-full md:w-72 px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-white shadow-sm"
            >
              {campanas.map((campana) => (
                <option key={campana.id} value={campana.id}>
                  {campana.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Trámites Table */}
        <Card className="p-0">
          <Table
            columns={[
              { key: 'nombre', label: 'Nombre' },
              { key: 'dn', label: 'DN' },
              { key: 'fecha', label: 'Fecha' },
              { key: 'fcv', label: 'FCV' },
              { key: 'estado', label: 'Estado' },
              { key: 'acciones', label: 'Acciones' },
            ]}
            data={tramites}
            renderRow={(tramite) => (
              <>
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{tramite.nombre}</div>
                  <div className="text-sm text-gray-500">{tramite.apellidoPaterno}</div>
                  {tramite.mensajeCorreccion && (
                    <div className="mt-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                      ⚠️ {tramite.mensajeCorreccion}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-sm font-mono text-gray-700">
                  {tramite.dn || 'N/A'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(tramite.fechaCreacion).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                  })}{' '}
                  {new Date(tramite.fechaCreacion).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-700">
                  {tramite.fvcFecha || 'N/A'}
                </td>
                <td className="px-6 py-4">
                  <EstadoBadge estado={tramite.estadoVista || tramite.estado} />
                </td>
                <td className="px-6 py-4">
                  {tramite.estadoVista === 'en_proceso' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/tramites/${tramite.id}/editar`);
                      }}
                    >
                      ✏️ Editar
                    </Button>
                  )}
                  {tramite.estadoVista === 'pendiente' && (
                    <span className="text-sm text-gray-400">En cola</span>
                  )}
                  {tramite.estadoVista === 'completado' && (
                    <span className="text-sm text-green-600">✓ Completado</span>
                  )}
                </td>
              </>
            )}
            emptyMessage="No hay trámites para mostrar"
          />
        </Card>
      </main>
    </div>
  );
};
