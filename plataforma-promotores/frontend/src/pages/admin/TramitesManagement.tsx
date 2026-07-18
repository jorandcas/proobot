import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Tramite, Campana } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { EstadoBadge } from '../../components/common/EstadoBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const TramitesManagement: React.FC = () => {
  const toast = useToast();
  const [tramites, setTramites] = useState<Tramite[]>([]);
  const [campanas, setCampanas] = useState<Campana[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    estado: '',
    idCampana: '',
    search: '',
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tramitesRes, campanasRes] = await Promise.all([
        apiService.getTramites(filters),
        apiService.getCampanas(),
      ]);

      if (tramitesRes.data.success) {
        setTramites(tramitesRes.data.data || []);
      }
      if (campanasRes.data.success) {
        setCampanas(campanasRes.data.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.showError('Error al cargar los trámites');
    } finally {
      setLoading(false);
    }
  };

  const handleResetTramite = async (id: string, nombre: string) => {
    if (!confirm(`¿Deseas reiniciar el trámite de ${nombre}? Volverá a estar pendiente para ser procesado.`)) {
      return;
    }

    try {
      const response = await apiService.resetTramite(id);
      if (response.data.success) {
        toast.showSuccess('Trámite reiniciado exitosamente');
        loadData();
      } else {
        toast.showError('Error: ' + (response.data.error || 'Desconocido'));
      }
    } catch (error: any) {
      toast.showError('Error: ' + error.message);
    }
  };

  const handleCancelTramite = async (id: string, nombre: string) => {
    if (!confirm(`¿Deseas cancelar el trámite de ${nombre}?`)) {
      return;
    }

    try {
      const response = await apiService.cancelTramite(id);
      if (response.data.success) {
        toast.showSuccess('Trámite cancelado exitosamente');
        loadData();
      } else {
        toast.showError('Error: ' + (response.data.error || 'Desconocido'));
      }
    } catch (error: any) {
      toast.showError('Error: ' + error.message);
    }
  };

  const filteredTramites = tramites.filter(tramite => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchNombre = tramite.nombre?.toLowerCase().includes(searchLower) || '';
      const matchApellido = tramite.apellidoPaterno?.toLowerCase().includes(searchLower) || '';
      const matchICC = tramite.icc?.toLowerCase().includes(searchLower) || '';
      if (!matchNombre && !matchApellido && !matchICC) return false;
    }
    return true;
  });

  const errorTramites = filteredTramites.filter(t => t.estado === 'error');
  const otherTramites = filteredTramites.filter(t => t.estado !== 'error');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Cargando trámites..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Trámites</h2>
        <p className="text-gray-600 mt-1">Administra todos los trámites de la plataforma</p>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              value={filters.estado}
              onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="pendiente">Pendientes</option>
              <option value="en_proceso">En Proceso</option>
              <option value="completado">Completados</option>
              <option value="error">Con Errores</option>
              <option value="cancelado">Cancelados</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Campaña
            </label>
            <select
              value={filters.idCampana}
              onChange={(e) => setFilters({ ...filters, idCampana: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas</option>
              {campanas.map((campana) => (
                <option key={campana.id} value={campana.id}>
                  {campana.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar por nombre, apellido o ICC
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Escribe para buscar..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-red-50 border-red-200">
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">{errorTramites.length}</div>
            <div className="text-sm text-red-700 font-medium mt-1">Con Errores</div>
          </div>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">
              {filteredTramites.filter(t => t.estado === 'pendiente').length}
            </div>
            <div className="text-sm text-yellow-700 font-medium mt-1">Pendientes</div>
          </div>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {filteredTramites.filter(t => t.estado === 'procesando').length}
            </div>
            <div className="text-sm text-blue-700 font-medium mt-1">En Proceso</div>
          </div>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {filteredTramites.filter(t => t.estado === 'completado').length}
            </div>
            <div className="text-sm text-green-700 font-medium mt-1">Completados</div>
          </div>
        </Card>
      </div>

      {/* Trámites con Errores */}
      {errorTramites.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-red-900">⚠️ Trámites con Errores</h3>
            <p className="text-sm text-red-700 mt-1">
              Estos trámites fallaron durante el procesamiento y pueden ser reiniciados
            </p>
          </div>
          <div className="space-y-3">
            {errorTramites.map((tramite) => (
              <div
                key={tramite.id}
                className="bg-white p-4 rounded-lg border border-red-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-gray-900">
                        {tramite.nombre} {tramite.apellidoPaterno}
                      </h4>
                      <EstadoBadge estado={tramite.estadoVista || tramite.estado} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">ICC:</span> {tramite.icc || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">FCV:</span> {tramite.fvcFecha || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Promotor:</span> {tramite.promotorNombre || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Fecha:</span>{' '}
                        {new Date(tramite.fechaCreacion).toLocaleString('es-ES')}
                      </div>
                    </div>
                    {(tramite.mensajeCorreccion || tramite.resultado) && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        <span className="font-medium">Error:</span> {tramite.mensajeCorreccion || tramite.resultado}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleResetTramite(tramite.id, tramite.nombre)}
                    >
                      🔄 Reiniciar
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleCancelTramite(tramite.id, tramite.nombre)}
                    >
                      ✖ Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Otros Trámites */}
      <Card>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {filters.estado === 'error' ? 'Todos los Trámites' : 'Otros Trámites'}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {otherTramites.length} trámite{otherTramites.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="space-y-3">
          {otherTramites.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No hay trámites para mostrar
            </div>
          ) : (
            otherTramites.map((tramite) => (
              <div
                key={tramite.id}
                className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-gray-900">
                        {tramite.nombre} {tramite.apellidoPaterno}
                      </h4>
                      <EstadoBadge estado={tramite.estadoVista || tramite.estado} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">ICC:</span> {tramite.icc || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">FCV:</span> {tramite.fvcFecha || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Promotor:</span> {tramite.promotorNombre || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Fecha:</span>{' '}
                        {new Date(tramite.fechaCreacion).toLocaleString('es-ES')}
                      </div>
                    </div>
                  </div>
                  {tramite.estado === 'pendiente' && (
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleCancelTramite(tramite.id, tramite.nombre)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
