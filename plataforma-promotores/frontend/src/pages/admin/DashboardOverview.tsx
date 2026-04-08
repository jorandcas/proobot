import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { DashboardAdminStats } from '../../types';
import { Card } from '../../components/common/Card';
import { StatsCard } from '../../components/common/StatsCard';

export const DashboardOverview: React.FC = () => {
  const [stats, setStats] = useState<DashboardAdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const response = await apiService.getAdminStats();
      if (response.data.success && response.data.data) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando estadísticas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard General</h2>
        <p className="text-gray-600 mt-1">Vista general de la plataforma</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard title="Trámites Pendientes" value={stats.tramitesPendientes} />
        <StatsCard title="Éxitos Hoy" value={stats.exitoHoy} />
        <StatsCard title="Errores Hoy" value={stats.erroresHoy} />
        <StatsCard title="Dispositivos Disponibles" value={stats.devicesAvailable} />
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Trámites */}
        <Card title="Trámites">
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <span className="font-semibold text-slate-700">Hoy</span>
              <span className="text-2xl font-bold text-blue-600">{stats.tramitesHoy}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
              <span className="font-semibold text-slate-700">Esta Semana</span>
              <span className="text-2xl font-bold text-indigo-600">{stats.tramitesSemana}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
              <span className="font-semibold text-slate-700">Este Mes</span>
              <span className="text-2xl font-bold text-purple-600">{stats.tramitesMes}</span>
            </div>
          </div>
        </Card>

        {/* Sistema */}
        <Card title="Sistema">
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
              <span className="font-semibold text-slate-700">Promotores Activos</span>
              <span className="text-2xl font-bold text-emerald-600">{stats.promotoresActivos}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl border border-teal-100">
              <span className="font-semibold text-slate-700">Dispositivos Disponibles</span>
              <span className="text-2xl font-bold text-teal-600">{stats.devicesAvailable}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100">
              <span className="font-semibold text-slate-700">Dispositivos Ocupados</span>
              <span className="text-2xl font-bold text-amber-600">{stats.devicesBusy}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Última Ejecución */}
      {stats.ultimaEjecucion && (
        <Card title="Última Ejecución del Bot">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 font-medium">
                Fecha: {new Date(stats.ultimaEjecucion.fechaInicio).toLocaleString('es-ES')}
              </p>
              <p className="text-sm text-slate-600 font-medium mt-2">
                Estado: <span className={`px-3 py-1 rounded-full text-xs font-bold ${stats.ultimaEjecucion.estado === 'completado' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {stats.ultimaEjecucion.estado === 'completado' ? 'Completado' : 'En proceso'}
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-emerald-600">{stats.ultimaEjecucion.completados}</p>
              <p className="text-xs text-emerald-600 font-semibold mb-1">Completados</p>
              <p className="text-3xl font-bold text-red-600">{stats.ultimaEjecucion.errores}</p>
              <p className="text-xs text-red-600 font-semibold">Errores</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
