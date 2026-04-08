import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  delay?: string;
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  delay,
  className = ''
}) => {
  return (
    <div
      className={`
        bg-gradient-to-br from-slate-800 to-slate-900
        rounded-2xl
        border border-slate-700
        p-6
        transition-all duration-300
        hover:shadow-2xl hover:scale-105
        animate-fade-in
        ${className}
      `}
      style={delay ? { animationDelay: delay } : undefined}
    >
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">{title}</p>
      <p className="text-4xl font-bold text-white">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </div>
  );
};
