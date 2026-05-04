import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { DashboardPromotorStats, Tramite, Campana } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { EstadoBadge } from '../components/common/EstadoBadge';
import { Table } from '../components/common/Table';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

export const DashboardPromotor: React.FC = () => {
  console.log('🖥️ [FRONTEND] Renderizando DashboardPromotor...');

  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardPromotorStats | null>(null);
  const [tramites, setTramites] = useState<Tramite[]>([]);
  const [filteredTramites, setFilteredTramites] = useState<Tramite[]>([]);
  const [campanas, setCampanas] = useState<Campana[]>([]);
  const [selectedCampana, setSelectedCampana] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('🎬 [FRONTEND] Dashboard montado, iniciando carga...');
    loadData();
  }, []);

  useEffect(() => {
    filterTramites();
  }, [tramites, selectedCampana, selectedStatus, searchTerm, dateRange, customStartDate, customEndDate]);

  // Monitor state changes
  useEffect(() => {
    console.log('🔄 [FRONTEND] Estado tramites cambió:', {
      length: tramites.length,
      isArray: Array.isArray(tramites),
      firstItem: tramites[0]
    });
  }, [tramites]);

  useEffect(() => {
    console.log('🔄 [FRONTEND] Estado filteredTramites cambió:', {
      length: filteredTramites.length,
      isArray: Array.isArray(filteredTramites),
      firstItem: filteredTramites[0]
    });
  }, [filteredTramites]);

  const loadData = async () => {
    try {
      console.log('🚀 [FRONTEND] Iniciando carga de datos...');
      const [statsRes, tramitesRes, campanasRes] = await Promise.all([
        apiService.getPromotorStats(),
        apiService.getRecentTramites(1000), // Get more records for history
        apiService.getCampanasWithTramites(),
      ]);

      console.log('📊 [FRONTEND DEBUG] Stats Response:', statsRes.data);
      console.log('📊 [FRONTEND DEBUG] Trámites Response completo:', tramitesRes);
      console.log('📊 [FRONTEND DEBUG] Trámites Response.data:', tramitesRes.data);
      console.log('📊 [FRONTEND DEBUG] Trámites Response.data.data:', tramitesRes.data.data);
      console.log('📊 [FRONTEND DEBUG] Trámites Data Length:', tramitesRes.data.data?.length || 0);
      console.log('📊 [FRONTEND DEBUG] Campañas Response:', campanasRes.data);

      if (statsRes.data.success) {
        console.log('✅ [FRONTEND] Stats guardados:', statsRes.data.data);
        setStats(statsRes.data.data);
      }
      if (tramitesRes.data.success) {
        console.log('✅ [FRONTEND DEBUG] Trámites guardados:', tramitesRes.data.data);
        console.log('✅ [FRONTEND DEBUG] Tipo de tramitesRes.data.data:', Array.isArray(tramitesRes.data.data));
        setTramites(tramitesRes.data.data);
      } else {
        console.error('❌ [FRONTEND] Error en trámites response:', tramitesRes.data);
      }
      if (campanasRes.data.success) {
        console.log('✅ [FRONTEND] Campañas guardadas:', campanasRes.data.data);
        setCampanas(campanasRes.data.data);
      }
    } catch (error) {
      console.error('❌ [FRONTEND] Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterTramites = () => {
    let filtered = [...tramites];

    // Filter by campaign
    if (selectedCampana && selectedCampana !== 'all') {
      filtered = filtered.filter(t => t.idCampana === selectedCampana);
    }

    // Filter by status
    if (selectedStatus && selectedStatus !== 'all') {
      filtered = filtered.filter(t => t.estado === selectedStatus);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        t.dn?.toLowerCase().includes(term) ||
        t.nombre?.toLowerCase().includes(term) ||
        t.apellidoPaterno?.toLowerCase().includes(term) ||
        t.icc?.toLowerCase().includes(term)
      );
    }

    // Filter by date range
    if (dateRange === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filtered = filtered.filter(t => {
        const date = new Date(t.fechaCreacion);
        // Normalize to start of day in local timezone
        const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        return dateOnly.getTime() === today.getTime();
      });
    } else if (dateRange === 'week') {
      const weekAgo = new Date();
      weekAgo.setHours(0, 0, 0, 0);
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(t => {
        const date = new Date(t.fechaCreacion);
        // Normalize to start of day in local timezone
        const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        return dateOnly >= weekAgo;
      });
    } else if (dateRange === 'month') {
      const monthAgo = new Date();
      monthAgo.setHours(0, 0, 0, 0);
      monthAgo.setDate(monthAgo.getDate() - 30); // 30 days ago
      filtered = filtered.filter(t => {
        const date = new Date(t.fechaCreacion);
        // Normalize to start of day in local timezone
        const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        return dateOnly >= monthAgo;
      });
    } else if (dateRange === 'custom' && customStartDate && customEndDate) {
      const start = new Date(customStartDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(customEndDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(t => {
        const date = new Date(t.fechaCreacion);
        return date >= start && date <= end;
      });
    }

    setFilteredTramites(filtered);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleExport = () => {
    // Export to CSV
    const headers = ['DN', 'Nombre', 'Apellido Paterno', 'ICC', 'Estado', 'Fecha', 'Resultado'];
    const rows = filteredTramites.map(t => [
      t.dn || '',
      t.nombre || '',
      t.apellidoPaterno || '',
      t.icc || '',
      t.estado || '',
      new Date(t.fechaCreacion).toLocaleDateString('es-ES'),
      t.resultado || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `portabilidades_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner size="lg" text="Cargando..." />
      </div>
    );
  }

  const statsCards = stats ? [
    { title: 'Completados', value: stats.completados || 0, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Pendientes', value: stats.pendientes || 0, color: 'text-amber-600', bg: 'bg-amber-50' },
    { title: 'Errores', value: stats.errores || 0, color: 'text-red-600', bg: 'bg-red-50' },
    { title: 'Total', value: stats.total || 0, color: 'text-blue-600', bg: 'bg-blue-50' },
  ] : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Portabilidad</h1>
                <p className="text-xs text-gray-600">Bienvenido, {usuario?.nombre}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {statsCards.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">{stat.title}</p>
              <p className={`text-3xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">Historial de Portabilidades</h2>
              <p className="text-gray-600 mt-1">Gestiona y consulta el historial completo</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleExport}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Exportar CSV
              </Button>
              <Button onClick={() => navigate('/tramites/nuevo')}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nueva Portabilidad
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
              <input
                type="text"
                placeholder="DN, nombre, ICC..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Campaign */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Campaña</label>
              <select
                value={selectedCampana}
                onChange={(e) => setSelectedCampana(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todas</option>
                {campanas.map((campana) => (
                  <option key={campana.id} value={campana.id}>
                    {new Date(campana.fecha).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos</option>
                <option value="PENDIENTE">Pendientes</option>
                <option value="PROCESANDO">Procesando</option>
                <option value="COMPLETADO">Completados</option>
                <option value="ERROR">Errores</option>
                <option value="CANCELADO">Cancelados</option>
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todo</option>
                <option value="today">Hoy</option>
                <option value="week">Última semana</option>
                <option value="month">Último mes</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>
          </div>

          {/* Custom Date Range */}
          {dateRange === 'custom' && (
            <div className="grid grid-cols-1 md:cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Desde</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hasta</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </Card>

        {/* Results Summary */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Mostrando <span className="font-semibold text-gray-900">{filteredTramites.length}</span> de{' '}
            <span className="font-semibold text-gray-900">{tramites.length}</span> trámites
          </p>
          {(selectedCampana !== 'all' || selectedStatus !== 'all' || searchTerm || dateRange !== 'all') && (
            <button
              onClick={() => {
                setSelectedCampana('all');
                setSelectedStatus('all');
                setSearchTerm('');
                setDateRange('all');
                setCustomStartDate('');
                setCustomEndDate('');
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Table */}
        <Card>
          {console.log('📋 [FRONTEND] A punto de renderizar Table con:', {
            filteredLength: filteredTramites.length,
            filteredData: filteredTramites,
            isLoading
          })}
          <Table
            columns={[
              { key: 'fechaCreacion', label: 'Fecha', render: (value: any) => new Date(value).toLocaleDateString('es-ES') },
              { key: 'dn', label: 'DN' },
              {
                key: 'nombre',
                label: 'Cliente',
                render: (value: any, row: any) => `${row.nombre || ''} ${row.apellidoPaterno || ''}`.trim() || '-'
              },
              { key: 'icc', label: 'ICC' },
              {
                key: 'estado',
                label: 'Estado',
                render: (value: any) => <EstadoBadge estado={value} />
              },
              {
                key: 'id',
                label: 'Acciones',
                render: (value: any) => (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/tramites/${value}/editar`)}
                  >
                    Ver detalles
                  </Button>
                )
              }
            ]}
            data={filteredTramites}
            keyColumn="id"
          />
        </Card>
      </main>
    </div>
  );
};
