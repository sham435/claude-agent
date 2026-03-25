import React from 'react';

export const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center">
    <div className="relative w-12 h-12">
      <div className="absolute inset-0 rounded-full border-4 border-slate-700" />
      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin" />
    </div>
  </div>
);