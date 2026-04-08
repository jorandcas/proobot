import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { CrearTramiteRequest, FVCDateOption } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { ScannerModal } from '../components/common/ScannerModal';

export const FormTramite: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fvcOptions, setFvcOptions] = useState<FVCDateOption[]>([]);
  const [isLoadingFVC, setIsLoadingFVC] = useState(true);
  const [scanningICC, setScanningICC] = useState(false);

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

  // Cargar fechas FVC disponibles al montar el componente
  useEffect(() => {
    const loadFVCFechas = async () => {
      try {
        setIsLoadingFVC(true);
        const response = await apiService.getFVCFechas();
        if (response.data.success) {
          setFvcOptions(response.data.data);
          // Seleccionar la primera fecha por defecto
          if (response.data.data.length > 0) {
            setFormData((prev) => ({ ...prev, fvcFecha: response.data.data[0].fecha }));
          }
        }
      } catch (err) {
        console.error('Error cargando fechas FVC:', err);
        setError('Error al cargar las fechas disponibles');
      } finally {
        setIsLoadingFVC(false);
      }
    };

    loadFVCFechas();
  }, []);

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
      setError('Debes seleccionar una fecha FVC');
      setIsLoading(false);
      return;
    }

    if (!formData.fechaNacimiento || !/^\d{2}\/\d{2}\/\d{4}$/.test(formData.fechaNacimiento)) {
      setError('La fecha de nacimiento es obligatoria (formato dd/mm/yyyy)');
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiService.createTramite(formData as CrearTramiteRequest);

      if (response.data.success) {
        navigate('/dashboard');
      } else {
        setError(response.data.error || 'Error al crear trámite');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear trámite');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver al Dashboard
          </Button>
        </div>

        {/* Header */}
        <div className="mb-8 animate-slide-in">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Nueva Portabilidad</h1>
          <p className="text-gray-500">Completa el formulario con los datos del cliente</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Progress Steps */}
          <div className="mb-8 flex items-center justify-center gap-2 animate-slide-in">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">1</div>
              <span className="font-medium text-gray-700">Búsqueda</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-200"></div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">2</div>
              <span className="font-medium text-gray-700">Línea</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-200"></div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">3</div>
              <span className="font-medium text-gray-700">Datos Personales</span>
            </div>
          </div>

          {/* Sección 1: Búsqueda Porta */}
          <Card className="mb-6 animate-slide-in" title="1. Búsqueda Porta" subtitle="Datos para buscar la portabilidad">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="DN *"
                value={formData.dn}
                onChange={(e) => handleChange('dn', e.target.value)}
                placeholder="10 dígitos numéricos"
                maxLength={10}
                required
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 8V5z" />
                  </svg>
                }
              />
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ICC * <span className="text-xs font-normal text-gray-500">(19-20 dígitos)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.icc}
                    onChange={(e) => handleChange('icc', e.target.value.replace(/\D/g, '').toUpperCase())}
                    placeholder="Escanear o ingresar ICC"
                    maxLength={20}
                    required
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleScanICC}
                    disabled={scanningICC}
                    className="px-4 py-3 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                    title="Escanear código de barras"
                  >
                    {scanningICC ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">Escanea el código de barras o ingrésalo manualmente. La F final se omitirá automáticamente.</p>
              </div>
            </div>
          </Card>

          {/* Sección 2: Línea */}
          <Card className="mb-6 animate-slide-in" title="2. Línea" subtitle="Datos de la línea y FVC" style={{ animationDelay: '0.1s' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="NIP *"
                value={formData.nip}
                onChange={(e) => handleChange('nip', e.target.value.replace(/\D/g, ''))}
                placeholder="4 dígitos"
                maxLength={4}
                required
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                }
              />
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Fecha FVC * <span className="text-xs font-normal text-gray-500">(Fecha de activación)</span>
                </label>
                {isLoadingFVC ? (
                  <div className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500">
                    Cargando fechas disponibles...
                  </div>
                ) : (
                  <>
                    <select
                      value={formData.fvcFecha}
                      onChange={(e) => handleChange('fvcFecha', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 bg-white"
                      required
                    >
                      <option value="">Selecciona una fecha</option>
                      {fvcOptions.map((opcion) => (
                        <option key={opcion.indice} value={opcion.fecha}>
                          {opcion.label}
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-xs text-gray-500">
                      Las fechas disponibles se calculan automáticamente según la hora actual (antes/despues de 5 PM) y excluyen domingos.
                    </p>
                  </>
                )}
              </div>
            </div>
          </Card>

          {/* Sección 3: Datos Personales */}
          <Card className="mb-6 animate-slide-in" title="3. Datos Personales" subtitle="Información completa del cliente" style={{ animationDelay: '0.2s' }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input
                label="Nombre *"
                value={formData.nombre}
                onChange={(e) => handleChange('nombre', e.target.value.toUpperCase())}
                placeholder="Primer nombre"
                required
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
              />
              <Input
                label="Segundo Nombre"
                value={formData.nombreSegundo}
                onChange={(e) => handleChange('nombreSegundo', e.target.value.toUpperCase())}
                placeholder="Opcional"
              />
              <Input
                label="Apellido Paterno *"
                value={formData.apellidoPaterno}
                onChange={(e) => handleChange('apellidoPaterno', e.target.value.toUpperCase())}
                placeholder="Apellido paterno"
                required
              />
              <Input
                label="Apellido Materno"
                value={formData.apellidoMaterno}
                onChange={(e) => handleChange('apellidoMaterno', e.target.value.toUpperCase())}
                placeholder="Opcional (se usará 'R' si se deja vacío)"
              />
              <Input
                label="CURP *"
                value={formData.curp}
                onChange={(e) => handleChange('curp', e.target.value.toUpperCase())}
                placeholder="18 caracteres"
                maxLength={18}
                required
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-4 4h16a5 5 0 011 1v-1" />
                  </svg>
                }
              />
              <Input
                label="Teléfono *"
                value={formData.telefono}
                onChange={(e) => handleChange('telefono', e.target.value.replace(/\D/g, ''))}
                placeholder="10 dígitos"
                maxLength={10}
                required
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 8V5z" />
                  </svg>
                }
              />
              <Input
                label="Teléfono 2"
                value={formData.telefono2}
                onChange={(e) => handleChange('telefono2', e.target.value.replace(/\D/g, ''))}
                placeholder="10 dígitos (opcional)"
                maxLength={10}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 8V5z" />
                  </svg>
                }
              />
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Género *
                </label>
                <select
                  value={formData.genero}
                  onChange={(e) => handleChange('genero', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 bg-white"
                  required
                >
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                </select>
              </div>
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value.toLowerCase())}
                placeholder="Opcional"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
              />
              <Input
                label="Fecha Nacimiento *"
                value={formData.fechaNacimiento}
                onChange={(e) => {
                  // Auto-format: dd/mm/yyyy
                  let value = e.target.value.replace(/\D/g, '');
                  if (value.length >= 2) {
                    value = value.slice(0, 2) + '/' + value.slice(2);
                  }
                  if (value.length >= 5) {
                    value = value.slice(0, 5) + '/' + value.slice(5, 9);
                  }
                  handleChange('fechaNacimiento', value);
                }}
                placeholder="dd/mm/yyyy"
                maxLength={10}
                required
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
              />
            </div>
          </Card>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-xl flex items-start gap-3 animate-slide-in">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 animate-slide-in" style={{ animationDelay: '0.3s' }}>
            <Button type="submit" isLoading={isLoading} className="flex-1">
              {isLoading ? 'Guardando Trámite...' : 'Guardar Trámite'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/dashboard')}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>

      <ScannerModal
        isOpen={scanningICC}
        onClose={handleCloseScanner}
        onScan={handleICCScanned}
      />
    </div>
  );
};
