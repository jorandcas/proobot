import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { CrearTramiteRequest, FVCDateOption } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { ScannerModal } from '../components/common/ScannerModal';
import { useToast } from '../context/ToastContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const EditarTramite: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTramite, setIsLoadingTramite] = useState(true);
  const [error, setError] = useState('');
  const [fvcOptions, setFvcOptions] = useState<FVCDateOption[]>([]);
  const [isLoadingFVC, setIsLoadingFVC] = useState(true);
  const [scanningICC, setScanningICC] = useState(false);
  const [mensajeCorreccion, setMensajeCorreccion] = useState('');

  const [formData, setFormData] = useState<Omit<CrearTramiteRequest, 'fvcFecha'> & { fvcFecha: string }>({
    dn: '',
    icc: '',
    fvcFecha: '',
    nip: '',
    nombre: '',
    nombreSegundo: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    curp: '',
    telefono: '',
    telefono2: '',
    genero: 'Masculino',
    email: '',
    fechaNacimiento: '',
  });

  // Cargar datos del trámite y fechas FVC
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingTramite(true);

        // Cargar datos del trámite
        const tramiteResponse = await apiService.getTramiteById(id!);
        if (tramiteResponse.data.success) {
          const tramite = tramiteResponse.data.data;
          setFormData({
            dn: tramite.dn,
            icc: tramite.icc,
            fvcFecha: tramite.fvcFecha,
            nip: tramite.nip,
            nombre: tramite.nombre,
            nombreSegundo: tramite.nombreSegundo || '',
            apellidoPaterno: tramite.apellidoPaterno,
            apellidoMaterno: tramite.apellidoMaterno,
            curp: tramite.curp,
            telefono: tramite.telefono,
            telefono2: tramite.telefono2 || '',
            genero: tramite.genero,
            email: tramite.email || '',
            fechaNacimiento: tramite.fechaNacimiento || '',
          });
          setMensajeCorreccion(tramite.mensajeCorreccion || '');
        } else {
          toast.showError('Error al cargar el trámite');
          navigate('/dashboard');
          return;
        }

        // Cargar fechas FVC
        const fvcResponse = await apiService.getFVCFechas();
        if (fvcResponse.data.success) {
          setFvcOptions(fvcResponse.data.data);
        }
      } catch (err) {
        console.error('Error cargando datos:', err);
        toast.showError('Error al cargar los datos');
        navigate('/dashboard');
      } finally {
        setIsLoadingTramite(false);
        setIsLoadingFVC(false);
      }
    };

    loadData();
  }, [id]);

  // Función para abrir el escáner de ICC
  const handleScanICC = () => {
    setScanningICC(true);
    setError('');
  };

  // Callback cuando se detecta un código
  const handleICCScanned = (cleanCode: string) => {
    setFormData((prev) => ({ ...prev, icc: cleanCode }));
    setScanningICC(false);
  };

  // Callback para cerrar el modal
  const handleCloseScanner = () => {
    setScanningICC(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validaciones frontend
    if (!formData.dn || formData.dn.length !== 10 || !/^\d+$/.test(formData.dn)) {
      setError('El DN debe contener exactamente 10 dígitos numéricos');
      setIsLoading(false);
      return;
    }

    if (!formData.icc || formData.icc.length < 19 || !/^\d{19,20}$/.test(formData.icc)) {
      setError('El ICC debe contener entre 19 y 20 dígitos numéricos');
      setIsLoading(false);
      return;
    }

    if (!formData.nip || formData.nip.length !== 4 || !/^\d+$/.test(formData.nip)) {
      setError('El NIP debe contener exactamente 4 dígitos numéricos');
      setIsLoading(false);
      return;
    }

    if (!formData.fvcFecha) {
      setError('La fecha FVC es obligatoria');
      setIsLoading(false);
      return;
    }

    if (!formData.nombre || formData.nombre.trim().length < 2) {
      setError('El nombre es obligatorio y debe tener al menos 2 caracteres');
      setIsLoading(false);
      return;
    }

    if (!formData.apellidoPaterno || formData.apellidoPaterno.trim().length < 2) {
      setError('El apellido paterno es obligatorio y debe tener al menos 2 caracteres');
      setIsLoading(false);
      return;
    }

    if (!formData.curp || formData.curp.length !== 18) {
      setError('El CURP debe contener exactamente 18 caracteres');
      setIsLoading(false);
      return;
    }

    if (!formData.telefono || formData.telefono.length !== 10 || !/^\d+$/.test(formData.telefono)) {
      setError('El teléfono debe contener exactamente 10 dígitos numéricos');
      setIsLoading(false);
      return;
    }

    if (!formData.fechaNacimiento) {
      setError('La fecha de nacimiento es obligatoria');
      setIsLoading(false);
      return;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('El email no tiene un formato válido');
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiService.corregirTramite(id!, formData);

      if (response.data.success) {
        toast.showSuccess('Trámite actualizado y puesto en cola para reprocesar');
        navigate('/dashboard');
      } else {
        setError(response.data.error || 'Error al actualizar el trámite');
      }
    } catch (err: any) {
      console.error('Error actualizando trámite:', err);
      setError(err.response?.data?.error || 'Error al actualizar el trámite');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingTramite) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Cargando trámite..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-slate-600 hover:text-slate-900 mr-4"
            >
              ← Volver
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Editar Trámite</h1>
              <p className="text-xs text-slate-500 mt-0.5">Corregir datos y reintentar</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Mensaje de corrección */}
        {mensajeCorreccion && (
          <Card className="mb-6 bg-red-50 border-red-200">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-1">Se requiere corrección</h3>
                <p className="text-sm text-red-700">{mensajeCorreccion}</p>
                <p className="text-xs text-red-600 mt-2">Por favor, corrige los datos marcados y vuelve a intentar.</p>
              </div>
            </div>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sección 1: Búsqueda Porta */}
          <Card>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
                Búsqueda Porta
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="DN (10 dígitos)"
                value={formData.dn}
                onChange={(e) => setFormData({ ...formData, dn: e.target.value })}
                placeholder="10 dígitos numéricos"
                maxLength={10}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ICC (Código de barras SIM)
                </label>
                <div className="flex gap-2">
                  <Input
                    value={formData.icc}
                    onChange={(e) => setFormData({ ...formData, icc: e.target.value })}
                    placeholder="19-20 dígitos"
                    maxLength={20}
                    className="flex-1"
                    required
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleScanICC}
                    className="whitespace-nowrap"
                  >
                    📷 Escanear
                  </Button>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Venta de Canje (FVC)
                </label>
                <select
                  value={formData.fvcFecha}
                  onChange={(e) => setFormData({ ...formData, fvcFecha: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoadingFVC}
                  required
                >
                  <option value="">Selecciona una fecha...</option>
                  {fvcOptions.map((opcion) => (
                    <option key={opcion.fecha} value={opcion.fecha}>
                      {opcion.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Sección 2: Línea */}
          <Card>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
                Sección Línea
              </h2>
            </div>

            <Input
              label="NIP (4 dígitos)"
              value={formData.nip}
              onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
              placeholder="****"
              type="password"
              maxLength={4}
              required
            />
          </Card>

          {/* Sección 3: Datos Personales */}
          <Card>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span>
                Datos Personales
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value.toUpperCase() })}
                placeholder="Nombre completo"
                required
              />

              <Input
                label="Segundo Nombre (Opcional)"
                value={formData.nombreSegundo}
                onChange={(e) => setFormData({ ...formData, nombreSegundo: e.target.value.toUpperCase() })}
                placeholder="Segundo nombre"
              />

              <Input
                label="Apellido Paterno"
                value={formData.apellidoPaterno}
                onChange={(e) => setFormData({ ...formData, apellidoPaterno: e.target.value.toUpperCase() })}
                placeholder="Apellido paterno"
                required
              />

              <Input
                label="Apellido Materno"
                value={formData.apellidoMaterno}
                onChange={(e) => setFormData({ ...formData, apellidoMaterno: e.target.value.toUpperCase() })}
                placeholder="Apellido materno (opcional, se pondrá 'R' si está vacío)"
              />

              <Input
                label="CURP (18 caracteres)"
                value={formData.curp}
                onChange={(e) => setFormData({ ...formData, curp: e.target.value.toUpperCase() })}
                placeholder="18 caracteres (letras y números)"
                maxLength={18}
                required
              />

              <Input
                label="Teléfono (10 dígitos)"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="10 dígitos numéricos"
                maxLength={10}
                required
              />

              <Input
                label="Telorno Adicional (Opcional)"
                value={formData.telefono2}
                onChange={(e) => setFormData({ ...formData, telefono2: e.target.value })}
                placeholder="10 dígitos numéricos"
                maxLength={10}
              />

              <Input
                label="Fecha de Nacimiento"
                value={formData.fechaNacimiento}
                onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                placeholder="DD/MM/YYYY"
                maxLength={10}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Género
                </label>
                <select
                  value={formData.genero}
                  onChange={(e) => setFormData({ ...formData, genero: e.target.value as 'Masculino' | 'Femenino' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <Input
                  label="Email (Opcional)"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
                  placeholder="correo@ejemplo.com"
                />
              </div>
            </div>
          </Card>

          {/* Error Message */}
          {error && (
            <Card className="bg-red-50 border-red-200">
              <p className="text-red-800 font-medium">{error}</p>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Guardando...' : '✓ Actualizar y Reintentar'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/dashboard')}
              disabled={isLoading}
            >
              Cancelar
            </Button>
          </div>
        </form>

        {/* Scanner Modal */}
        <ScannerModal
          isOpen={scanningICC}
          onClose={handleCloseScanner}
          onCodeDetected={handleICCScanned}
        />
      </main>
    </div>
  );
};
