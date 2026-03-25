import React from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps {
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'primary',
  children,
  className = '',
}) => {
  const variantStyles = {
    primary: 'bg-blue-900/50 text-blue-400 border-blue-500/50',
    success: 'bg-green-900/50 text-green-400 border-green-500/50',
    warning: 'bg-yellow-900/50 text-yellow-400 border-yellow-500/50',
    error: 'bg-red-900/50 text-red-400 border-red-500/50',
    info: 'bg-cyan-900/50 text-cyan-400 border-cyan-500/50',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
};