import React, { useEffect, useRef } from 'react';

interface BotProgressProps {
  ejecutando: boolean;
  ejecucion?: {
    id: string;
    totalTramites: number;
    completados: number;
    errores: number;
    progreso: number;
    logs?: string[];
    currentTramite?: string;
  } | null;
}

export const BotProgress: React.FC<BotProgressProps> = ({ ejecutando, ejecucion }) => {
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when logs update
  useEffect(() => {
    if (logsEndRef.current && ejecucion?.logs) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [ejecucion?.logs]);

  if (!ejecutando || !ejecucion) {
    return null;
  }

  const { totalTramites, completados, errores, progreso, logs } = ejecucion;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Bot en ejecución</h3>
            <p className="text-xs text-gray-500">
              Trámites: {completados + errores}/{totalTramites} procesados
            </p>
          </div>
        </div>
        <span className="text-2xl font-bold text-blue-600">{progreso}%</span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden relative">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
            style={{ width: `${progreso}%` }}
          >
            {progreso > 10 && (
              <span className="text-xs font-bold text-white drop-shadow-md">{progreso}%</span>
            )}
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Inicio</span>
          <span>{progreso}% completado</span>
          <span>Fin</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">{totalTramites}</div>
          <div className="text-xs text-gray-500">Total</div>
        </div>
        <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-600">{totalTramites - completados - errores}</div>
          <div className="text-xs text-gray-500">En Proceso</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-600">{completados}</div>
          <div className="text-xs text-gray-500">Completados</div>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
          <div className="text-2xl font-bold text-red-600">{errores}</div>
          <div className="text-xs text-gray-500">Errores</div>
        </div>
      </div>

      {/* Logs Section */}
      {logs && logs.length > 0 && (
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">
              📋 Registro de actividad ({logs.length} mensajes):
            </h4>
            <span className="text-xs text-gray-500">
              Últimos 20 mensajes
            </span>
          </div>
          <div className="bg-gray-900 text-green-400 rounded-lg p-4 max-h-64 overflow-y-auto font-mono text-xs shadow-inner">
            {logs.slice(-20).map((log, index) => {
              // Parse log to show different colors based on type
              const isError = log.toLowerCase().includes('error') || log.toLowerCase().includes('failed');
              const isWarning = log.toLowerCase().includes('warn') || log.toLowerCase().includes('timeout');
              const isSuccess = log.toLowerCase().includes('✅') || log.toLowerCase().includes('success') || log.toLowerCase().includes('completado');

              let colorClass = 'text-green-400';
              if (isError) colorClass = 'text-red-400 font-semibold';
              else if (isWarning) colorClass = 'text-yellow-400';
              else if (isSuccess) colorClass = 'text-green-300 font-semibold';

              return (
                <div key={index} className={`mb-1 ${colorClass} hover:bg-gray-800 px-1 rounded`}>
                  {log}
                </div>
              );
            })}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}
    </div>
  );
};
