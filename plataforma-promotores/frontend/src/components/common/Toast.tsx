import React from 'react';
import { useToast } from '../../context/ToastContext';

const ToastIcon: React.FC<{ type: string }> = ({ type }) => {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  };
  return <span className="text-xl">{icons[type as keyof typeof icons]}</span>;
};

export const Toast: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            transform transition-all duration-300 ease-in-out
            flex items-center gap-3 p-4 rounded-lg shadow-lg
            ${toast.type === 'success' && 'bg-green-500 text-white'}
            ${toast.type === 'error' && 'bg-red-500 text-white'}
            ${toast.type === 'warning' && 'bg-yellow-500 text-white'}
            ${toast.type === 'info' && 'bg-blue-500 text-white'}
          `}
        >
          <ToastIcon type={toast.type} />
          <p className="flex-1 text-sm font-medium">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-white/80 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};
