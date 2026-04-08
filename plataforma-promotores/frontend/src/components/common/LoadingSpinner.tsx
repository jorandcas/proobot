import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
  text
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-3',
    lg: 'w-12 h-12 border-4'
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div
        className={`
          ${sizeClasses[size]}
          border-indigo-200
          border-t-indigo-600
          rounded-full
          animate-spin
        `}
      />
      {text && (
        <p className="text-sm text-gray-500 font-medium">{text}</p>
      )}
    </div>
  );
};
