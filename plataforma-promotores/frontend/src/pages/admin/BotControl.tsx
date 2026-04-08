import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { DashboardAdminStats, Device } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { BotProgress } from '../../components/common/BotProgress';

export const BotControl: React.FC = () => {
  const toast = useToast();
  const [stats, setStats] = useState<DashboardAdminStats | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [botStatus, setBotStatus] = useState<any>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [newDeviceUdid, setNewDeviceUdid] = useState('');
  const [newDeviceName, setNewDeviceName] = useState('');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, statusRes, devicesRes] = await Promise.all([
        apiService.getAdminStats(),
        apiService.getBotStatus(),
        apiService.getDevices(),
      ]);

      if (statsRes.data.success && statsRes.data.data) setStats(statsRes.data.data);
      if (statusRes.data.success && statusRes.data.data) setBotStatus(statusRes.data.data);
      if (devicesRes.data.success && devicesRes.data.data) {
        setDevices(devicesRes.data.data.devices || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleExecuteBot = async () => {
    if (!confirm('¿Deseas ejecutar el bot para procesar los trámites pendientes?')) {
      return;
    }

    setIsExecuting(true);
    try {
      const response = await apiService.executeBot();
      if (response.data.success && response.data.data) {
        toast.showSuccess(`Iniciando procesamiento de ${response.data.data.totalTramites} trámites`);
        loadData();
      } else {
        toast.showError('Error al ejecutar el bot: ' + (response.data.error || 'Desconocido'));
      }
    } catch (error: any) {
      toast.showError('Error al ejecutar el bot: ' + error.message);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCancelBot = async () => {
    if (!confirm('¿Deseas cancelar la ejecución del bot? Los trámites en proceso volverán a estar pendientes.')) {
      return;
    }

    setIsExecuting(true);
    try {
      const response = await apiService.cancelBot();
      if (response.data.success) {
        toast.showSuccess('Ejecución del bot cancelada exitosamente');
        loadData();
      } else {
        toast.showError('Error al cancelar el bot: ' + (response.data.error || 'Desconocido'));
      }
    } catch (error: any) {
      toast.showError('Error al cancelar el bot: ' + error.message);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiService.addDevice(newDeviceUdid, newDeviceName);
      if (response.data.success) {
        toast.showSuccess('Dispositivo agregado exitosamente');
        setNewDeviceUdid('');
        setNewDeviceName('');
        setShowAddDevice(false);
        loadData();
      } else {
        toast.showError('Error: ' + (response.data.error || 'Desconocido'));
      }
    } catch (error: any) {
      toast.showError('Error: ' + error.message);
    }
  };

  const handleDeleteDevice = async (deviceId: string) => {
    if (!confirm('¿Deseas eliminar este dispositivo?')) {
      return;
    }

    try {
      const response = await apiService.deleteDevice(deviceId);
      if (response.data.success) {
        toast.showSuccess('Dispositivo eliminado');
        loadData();
      } else {
        toast.showError('Error: ' + (response.data.error || 'Desconocido'));
      }
    } catch (error: any) {
      toast.showError('Error: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Control del Bot</h2>
        <p className="text-gray-600 mt-1">Gestión de ejecución y dispositivos</p>
      </div>

      {/* Bot Execution */}
      <BotProgress
        ejecutando={botStatus?.ejecutando || false}
        ejecucion={botStatus?.ejecucion}
      />

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">Control de Ejecución</h3>
            {!botStatus?.ejecutando && stats?.ultimaEjecucion && (
              <div className="mt-2 text-sm text-gray-600">
                Última ejecución: {new Date(stats.ultimaEjecucion.fechaInicio).toLocaleString('es-ES')}
                {' '}({stats.ultimaEjecucion.completados} ✅, {stats.ultimaEjecucion.errores} ❌)
              </div>
            )}
          </div>
          {botStatus?.ejecutando ? (
            <Button
              onClick={handleCancelBot}
              disabled={isExecuting}
              variant="danger"
            >
              {isExecuting ? 'Cancelando...' : '⏹ Cancelar Ejecución'}
            </Button>
          ) : (
            <Button
              onClick={handleExecuteBot}
              disabled={isExecuting || !stats?.tramitesPendientes}
              variant="success"
            >
              {isExecuting
                ? 'Iniciando...'
                : stats?.tramitesPendientes
                ? `▶ Ejecutar Bot (${stats.tramitesPendientes} pendientes)`
                : 'No hay pendientes'}
            </Button>
          )}
        </div>
      </Card>

      {/* Devices */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Dispositivos</h3>
          <Button
            variant="primary"
            onClick={() => setShowAddDevice(!showAddDevice)}
          >
            + Agregar Dispositivo
          </Button>
        </div>

        {showAddDevice && (
          <form onSubmit={handleAddDevice} className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="UDID del dispositivo"
                value={newDeviceUdid}
                onChange={(e) => setNewDeviceUdid(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="text"
                placeholder="Nombre (ej: Dispositivo 1)"
                value={newDeviceName}
                onChange={(e) => setNewDeviceName(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <Button type="submit">Agregar</Button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {devices.map((device) => (
            <div
              key={device.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div>
                <div className="font-medium">{device.name}</div>
                <div className="text-sm text-gray-600">UDID: {device.udid}</div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  device.status === 'available'
                    ? 'bg-green-100 text-green-800'
                    : device.status === 'busy'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {device.status === 'available' ? 'Disponible' : device.status === 'busy' ? 'Ocupado' : 'Offline'}
                </span>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDeleteDevice(device.id)}
                >
                  Eliminar
                </Button>
              </div>
            </div>
          ))}
          {devices.length === 0 && (
            <div className="text-center text-gray-500 py-4">
              No hay dispositivos configurados
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
