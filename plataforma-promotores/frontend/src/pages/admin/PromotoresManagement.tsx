import React from 'react';
import { PromotoresManager } from '../../components/common/PromotoresManager';

export const PromotoresManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Promotores</h2>
        <p className="text-gray-600 mt-1">Administra promotores y sus sesiones</p>
      </div>

      {/* Promotores Manager Component */}
      <PromotoresManager />
    </div>
  );
};
