import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { DashboardAdminStats, WorkerStats } from '../../types';
import { Card } from '../../components/common/Card';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, color }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">{title}</p>
        <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
        {trend && (
          <div className={`flex items-center mt-2 text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            <span className="font-medium">{trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
            <span className="text-gray-500 ml-1">vs mes anterior</span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-lg ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
        {icon}
      </div>
    </div>
  </div>
);

export const DashboardOverview: React.FC = () => {
  const [stats] = useState<DashboardAdminStats | null>(null);
  const [workerStats, setWorkerStats] = useState<WorkerStats | null>(null);
  const [allTramites, setAllTramites] = useState<any[]>([]);
  const [filteredStats, setFilteredStats] = useState<any>({
    tramitesPendientes: 0,
    exitoHoy: 0,
    erroresHoy: 0,
    tramitesHoy: 0,
    tramitesSemana: 0,
    tramitesMes: 0,
    completados: 0,
    errores: 0,
    promotoresActivos: 0,
    devicesAvailable: 0,
    devicesBusy: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'all'>('month');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterStatsByPeriod();
  }, [selectedPeriod, allTramites]);

  const loadData = async () => {
    try {
      const [tramitesRes, workersRes] = await Promise.all([
        apiService.getRecentTramites(1000),
        apiService.getWorkerStats(),
      ]);
      if (tramitesRes.data.success && tramitesRes.data.data) {
        setAllTramites(tramitesRes.data.data);
      }
      if (workersRes.data.success && workersRes.data.data) {
        setWorkerStats(workersRes.data.data.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterStatsByPeriod = () => {
    const now = new Date();
    let filtered = allTramites;

    switch (selectedPeriod) {
      case 'today':
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        filtered = allTramites.filter(t => new Date(t.fechaCreacion) >= today);
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = allTramites.filter(t => new Date(t.fechaCreacion) >= weekAgo);
        break;
      case 'month':
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        filtered = allTramites.filter(t => new Date(t.fechaCreacion) >= monthAgo);
        break;
      case 'all':
      default:
        filtered = allTramites;
    }

    // Calcular estadísticas
    const pendientes = filtered.filter(t => t.estado === 'PENDIENTE').length;
    const completados = filtered.filter(t => t.estado === 'COMPLETADO').length;
    const errores = filtered.filter(t => t.estado === 'ERROR').length;

    // Calcular stats por fecha
    const today_start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const hoyCompletados = filtered.filter(t =>
      t.estado === 'COMPLETADO' && new Date(t.fechaCreacion) >= today_start
    ).length;
    const hoyErrores = filtered.filter(t =>
      t.estado === 'ERROR' && new Date(t.fechaCreacion) >= today_start
    ).length;

    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const semana = filtered.filter(t => new Date(t.fechaCreacion) >= weekAgo).length;

    const monthAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const mes = filtered.filter(t => new Date(t.fechaCreacion) >= monthAgo).length;

    setFilteredStats({
      tramitesPendientes: pendientes,
      exitoHoy: hoyCompletados,
      erroresHoy: hoyErrores,
      tramitesHoy: hoyCompletados + hoyErrores,
      tramitesSemana: semana,
      tramitesMes: mes,
      completados: completados,
      errores: errores,
      promotoresActivos: 0, // Se obtiene del backend
      devicesAvailable: 0, // Se obtiene del backend
      devicesBusy: 0, // Se obtiene del backend
    });
  };

  // Usar filteredStats si está disponible, si no usar stats original
  const displayStats = filteredStats || stats;

  if (loading || !displayStats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  const successRate = displayStats.exitoHoy + displayStats.erroresHoy > 0
    ? Math.round((displayStats.exitoHoy / (displayStats.exitoHoy + displayStats.erroresHoy)) * 100)
    : 0;

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'today': return 'Hoy';
      case 'week': return 'Esta Semana';
      case 'month': return 'Este Mes';
      case 'all': return 'Histórico Completo';
      default: return 'Este Mes';
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Dashboard General</h2>
          <p className="text-gray-600 mt-2">Vista general de la plataforma de portabilidades</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
          >
            <option value="today">Hoy</option>
            <option value="week">Esta Semana</option>
            <option value="month">Este Mes</option>
            <option value="all">Todo el Histórico</option>
          </select>
        </div>
      </div>

      {/* Period Indicator */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 inline-block">
        <p className="text-sm text-blue-800 font-medium">
          📊 Mostrando estadísticas: <span className="font-bold">{getPeriodLabel()}</span>
          <span className="mx-2">•</span>
          {displayStats.tramitesMes || displayStats.tramitesSemana || displayStats.tramitesHoy} trámites
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Trámites del Período"
          value={displayStats.tramitesMes || displayStats.tramitesSemana || displayStats.tramitesHoy}
          icon={
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          color="text-blue-600"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Tasa de Éxito"
          value={`${successRate}%`}
          icon={
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="text-green-600"
          trend={{ value: 5, isPositive: true }}
        />
        <StatCard
          title="Pendientes"
          value={displayStats.tramitesPendientes}
          icon={
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="text-amber-600"
        />
        <StatCard
          title="Completados"
          value={displayStats.completados}
          icon={
            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="text-indigo-600"
        />
      </div>

      {/* Workers Status */}
      {workerStats && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Workers Conectados</h3>
            <span className="text-sm text-gray-500">{workerStats.total} equipos</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <div>
                <p className="text-2xl font-bold text-green-700">{workerStats.online}</p>
                <p className="text-xs text-green-600">En línea</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-yellow-700">{workerStats.busy}</p>
                <p className="text-xs text-yellow-600">Ocupados</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-700">{workerStats.offline}</p>
                <p className="text-xs text-red-600">Desconectados</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="w-3 h-3 rounded-full bg-gray-400" />
              <div>
                <p className="text-2xl font-bold text-gray-700">{workerStats.error}</p>
                <p className="text-xs text-gray-600">Error</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Rendimiento por Período</h3>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <p className="text-sm font-semibold text-gray-700 mb-2">Hoy</p>
              <p className="text-4xl font-bold text-blue-600">{displayStats.tramitesHoy}</p>
              <p className="text-xs text-gray-600 mt-2">trámites</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
              <p className="text-sm font-semibold text-gray-700 mb-2">Semana</p>
              <p className="text-4xl font-bold text-indigo-600">{displayStats.tramitesSemana}</p>
              <p className="text-xs text-gray-600 mt-2">trámites</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
              <p className="text-sm font-semibold text-gray-700 mb-2">Mes</p>
              <p className="text-4xl font-bold text-purple-600">{displayStats.tramitesMes}</p>
              <p className="text-xs text-gray-600 mt-2">trámites</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Progreso del período</span>
              <span className="font-semibold text-gray-900">{Math.min((displayStats.completados || 0) * 10, 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-600 to-indigo-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((displayStats.completados || 0) * 10, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">{displayStats.completados} completados de {(displayStats.completados || 0) + (displayStats.tramitesPendientes || 0)} totales</p>
          </div>
        </Card>

        {/* Stats Breakdown */}
        <Card>
          <h3 className="text-lg font-bold text-gray-900 mb-6">Desglose</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-100">
              <span className="font-semibold text-gray-700">Completados</span>
              <span className="text-2xl font-bold text-green-600">{displayStats.completados}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-100">
              <span className="font-semibold text-gray-700">Pendientes</span>
              <span className="text-2xl font-bold text-amber-600">{displayStats.tramitesPendientes}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
              <span className="font-semibold text-gray-700">Errores</span>
              <span className="text-2xl font-bold text-red-600">{displayStats.errores}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
              <span className="font-semibold text-gray-700">En Proceso</span>
              <span className="text-2xl font-bold text-blue-600">{(displayStats as any).procesando || 0}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
