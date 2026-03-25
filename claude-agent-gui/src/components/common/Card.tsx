import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  className = '',
}) => (
  <div className={`bg-slate-900 border border-slate-800 rounded-lg p-6 ${className}`}>
    {(title || subtitle) && (
      <div className="mb-4">
        {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
        {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
      </div>
    )}
    {children}
  </div>
);