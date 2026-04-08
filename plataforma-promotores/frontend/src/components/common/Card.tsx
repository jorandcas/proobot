import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  noPadding?: boolean;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  subtitle,
  icon,
  noPadding = false,
  style,
}) => {
  return (
    <div
      className={`bg-white rounded-2xl shadow-md hover:shadow-xl border border-slate-100 overflow-hidden transition-all duration-300 ${className}`}
      style={style}
    >
      {(title || subtitle || icon) && (
        <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {icon && <div className="text-blue-600">{icon}</div>}
              <div>
                {title && <h3 className="text-lg font-bold text-slate-900">{title}</h3>}
                {subtitle && <p className="text-sm text-slate-600 mt-0.5">{subtitle}</p>}
              </div>
            </div>
          </div>
        </div>
      )}
      <div className={noPadding ? '' : 'px-6 py-6'}>{children}</div>
    </div>
  );
};
