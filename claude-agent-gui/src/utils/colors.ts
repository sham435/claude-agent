export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'completed':
    case 'success':
      return 'bg-green-900/50 text-green-400 border-green-500/50';
    case 'failed':
    case 'error':
      return 'bg-red-900/50 text-red-400 border-red-500/50';
    case 'running':
    case 'pending':
      return 'bg-blue-900/50 text-blue-400 border-blue-500/50';
    case 'cancelled':
      return 'bg-slate-900/50 text-slate-400 border-slate-500/50';
    default:
      return 'bg-slate-900/50 text-slate-400 border-slate-500/50';
  }
};

export const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    'file-system': 'bg-blue-900/50 text-blue-400',
    'code-execution': 'bg-purple-900/50 text-purple-400',
    'git': 'bg-orange-900/50 text-orange-400',
    'package-management': 'bg-green-900/50 text-green-400',
    'code-analysis': 'bg-yellow-900/50 text-yellow-400',
  };
  return colors[category] || 'bg-slate-900/50 text-slate-400';
};