import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Card } from './Card';
import { Button } from './Button';

interface Promotor {
  id: string;
  correo: string;
  nombre: string;
  rol: string;
  fechaCreacion: string;
}

export const PromotoresManager: React.FC = () => {
  const [promotores, setPromotores] = useState<Promotor[]>([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const promotoresRes = await apiService.getAllUsers();

      if (promotoresRes.data.success && promotoresRes.data.data) {
        const onlyPromotores = promotoresRes.data.data.filter((u: Promotor) => u.rol === 'promotor');
        setPromotores(onlyPromotores);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRevokeSession = async (promotorId: string, promotorNombre: string) => {
    if (!confirm(`¿Cerrar la sesión activa de ${promotorNombre}?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.revokeSession(promotorId);
      if (response.data.success) {
        toast.showSuccess(`Sesión de ${promotorNombre} cerrada exitosamente`);
      } else {
        toast.showError('Error: ' + response.data.error);
      }
    } catch (error: any) {
      toast.showError('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold">Gestión de Promotores</h3>
          <p className="text-sm text-gray-600">Administrar promotores y sesiones</p>
        </div>
        <Button
          onClick={loadData}
          disabled={loading}
          variant="secondary"
        >
          🔄 Actualizar
        </Button>
      </div>

      {promotores.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No hay promotores registrados
        </div>
      ) : (
        <div className="space-y-4">
          {promotores.map((promotor) => (
            <div
              key={promotor.id}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-xl">👤</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{promotor.nombre}</h4>
                      <p className="text-sm text-gray-600">{promotor.correo}</p>
                    </div>
                  </div>

                  <div className="mt-3 text-sm">
                    <span className="text-gray-500">Registrado:</span>
                    <span className="font-medium ml-2">{new Date(promotor.fechaCreacion).toLocaleDateString('es-ES')}</span>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    onClick={() => handleRevokeSession(promotor.id, promotor.nombre)}
                    disabled={loading}
                    variant="secondary"
                    size="sm"
                  >
                    🔒 Cerrar Sesión
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default PromotoresManager;
