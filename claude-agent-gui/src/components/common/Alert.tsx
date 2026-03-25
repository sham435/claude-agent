import React, { ReactNode } from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';

interface AlertProps {
  type: 'error' | 'success' | 'info' | 'warning';
  title?: string;
  message: ReactNode;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type,
  title,
  message,
  onClose,
  className = '',
}) => {
  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'error':
        return 'bg-red-900/20 border-red-500/50 text-red-200';
      case 'success':
        return 'bg-green-900/20 border-green-500/50 text-green-200';
      case 'warning':
        return 'bg-yellow-900/20 border-yellow-500/50 text-yellow-200';
      default:
        return 'bg-blue-900/20 border-blue-500/50 text-blue-200';
    }
  };

  return (
    <div
      className={cn('flex items-start gap-3 p-4 rounded-lg border', getStyles(), className)}
      role="alert"
    >
      {getIcon()}
      <div className="flex-1">
        {title && <h4 className="font-semibold mb-1">{title}</h4>}
        <p className="text-sm">{message}</p>
      </div>
      {onClose && (
        <button type="button" onClick={onClose} className="text-lg leading-none opacity-50 hover:opacity-75">
          ×
        </button>
      )}
    </div>
  );
};