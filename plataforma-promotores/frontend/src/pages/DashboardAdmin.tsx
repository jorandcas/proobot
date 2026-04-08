import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// This component now redirects to the new admin structure
export const DashboardAdmin: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the new dashboard structure
    navigate('/admin/dashboard', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-gray-600">Redirigiendo...</div>
    </div>
  );
};
