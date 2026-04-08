import React from 'react';
import { TramiteEstado, TramiteEstadoVista } from '../../types';

interface EstadoBadgeProps {
  estado: TramiteEstado | TramiteEstadoVista;
  size?: 'sm' | 'md';
}

const estadoConfig = {
  // Estados completos (admin)
  pendiente: {
    label: 'Pendiente',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
    icon: '⏳',
  },
  procesando: {
    label: 'Procesando',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    icon: '🔄',
  },
  completado: {
    label: 'Completado',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    icon: '✅',
  },
  error: {
    label: 'Error',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    icon: '❌',
  },
  cancelado: {
    label: 'Cancelado',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-200',
    icon: '🚫',
  },
  // Estados traducidos (promotor)
  en_proceso: {
    label: 'En Proceso',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    icon: '🔄',
  },
};

export const EstadoBadge: React.FC<EstadoBadgeProps> = ({ estado, size = 'md' }) => {
  const config = estadoConfig[estado];
  const sizeClasses = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border-2 ${sizeClasses} ${
        config.bgColor
      } ${config.textColor} ${config.borderColor}`}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
};
