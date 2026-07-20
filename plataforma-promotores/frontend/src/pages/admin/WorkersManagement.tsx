import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Worker, WorkerStats } from '../../types';
import { Card } from '../../components/common/Card';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  ONLINE: { label: 'En línea', bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
  BUSY: { label: 'Ocupado', bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
  OFFLINE: { label: 'Desconectado', bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
  ERROR: { label: 'Error', bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-600' },
};

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Nunca';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'hace un momento';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
  return `hace ${Math.floor(diff / 86400)}d`;
}

export const WorkersManagement: React.FC = () => {
  const toast = useToast();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [stats, setStats] = useState<WorkerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [workersRes, statsRes] = await Promise.all([
        apiService.getWorkers(),
        apiService.getWorkerStats(),
      ]);
      if (workersRes.data.success && workersRes.data.data) {
        setWorkers(workersRes.data.data.workers || []);
      }
      if (statsRes.data.success && statsRes.data.data) {
        setStats(statsRes.data.data.stats);
      }
    } catch (error) {
      console.error('Error loading workers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorker = async (workerId: string, workerName: string) => {
    if (!confirm(`¿Eliminar worker "${workerName}"?`)) return;
    try {
      const response = await apiService.deleteWorker(workerId);
      if (response.data.success) {
        toast.showSuccess('Worker eliminado');
        loadData();
      } else {
        toast.showError('Error: ' + (response.data.error || 'Desconocido'));
      }
    } catch (error: any) {
      toast.showError('Error: ' + error.message);
    }
  };

  const filteredWorkers = filter === 'all'
    ? workers
    : workers.filter(w => w.status === filter);

  if (loading && !workers.length) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Cargando workers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Workers</h2>
          <p className="text-gray-600 mt-1">Equipos disponibles para procesar trámites</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-600 mt-1">Total</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{stats.online}</p>
            <p className="text-sm text-gray-600 mt-1">En línea</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-yellow-600">{stats.busy}</p>
            <p className="text-sm text-gray-600 mt-1">Ocupados</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-red-600">{stats.offline}</p>
            <p className="text-sm text-gray-600 mt-1">Desconectados</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-red-600">{stats.error}</p>
            <p className="text-sm text-gray-600 mt-1">Error</p>
          </div>
        </div>
      )}

      {/* Filter */}
      <Card>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-700 mr-2">Filtrar:</span>
          {[
            { value: 'all', label: 'Todos' },
            { value: 'ONLINE', label: 'En línea' },
            { value: 'BUSY', label: 'Ocupados' },
            { value: 'OFFLINE', label: 'Desconectados' },
            { value: 'ERROR', label: 'Error' },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Workers List */}
      <Card>
        <div className="space-y-3">
          {filteredWorkers.map((worker) => {
            const statusCfg = STATUS_CONFIG[worker.status] || STATUS_CONFIG.OFFLINE;
            return (
              <div
                key={worker.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${statusCfg.dot} ${worker.status === 'ONLINE' ? 'animate-pulse' : ''}`} />
                  <div>
                    <div className="font-semibold text-gray-900">{worker.name}</div>
                    <div className="text-sm text-gray-500">
                      {worker.location}
                      {worker.device && ` • Dispositivo: ${worker.device.name}`}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {worker.ip && `IP: ${worker.ip} • `}
                      Último heartbeat: {timeAgo(worker.lastHeartbeat)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusCfg.bg} ${statusCfg.text}`}>
                    {statusCfg.label}
                  </span>
                  <button
                    onClick={() => handleDeleteWorker(worker.id, worker.name)}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
          {filteredWorkers.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              {filter === 'all'
                ? 'No hay workers registrados'
                : `No hay workers con estado "${filter}"`}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
