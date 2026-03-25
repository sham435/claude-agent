import { useMemo } from 'react';
import { Activity, CheckCircle, AlertCircle, Clock, TrendingUp, Zap } from 'lucide-react';
import { useAgentStatus, useAgentStats, useExecutionHistory } from '../hooks';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export default function Dashboard() {
  const { data: status, isLoading: statusLoading } = useAgentStatus();
  const { data: stats, isLoading: statsLoading } = useAgentStats();
  const { data: history } = useExecutionHistory(10);

  const successRate = useMemo(() => {
    if (!stats || stats.totalExecutions === 0) return 0;
    return Math.round((stats.successfulExecutions / stats.totalExecutions) * 100);
  }, [stats]);

  const avgDuration = useMemo(() => {
    if (!stats) return 0;
    return Math.round(stats.averageDuration);
  }, [stats]);

  if (statusLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Welcome to Claude Agent</h2>
            <p className="text-blue-100">
              {status?.isRunning ? 'Agent is currently running' : 'Agent is ready to run'}
            </p>
          </div>
          <div className="text-6xl opacity-20">
            <Zap className="w-24 h-24" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-400">Total Executions</span>
            <Activity className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-white">{stats?.totalExecutions || 0}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-400">Success Rate</span>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-white">{successRate}%</div>
          <p className="text-sm text-slate-500 mt-2">{stats?.successfulExecutions || 0} successful</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-400">Failed</span>
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-3xl font-bold text-white">{stats?.failedExecutions || 0}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-400">Avg Duration</span>
            <Clock className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="text-3xl font-bold text-white">{avgDuration}ms</div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          Recent Executions
        </h3>
        <div className="space-y-2">
          {history && history.length > 0 ? (
            history.map((execution) => (
              <div
                key={execution.id}
                className="flex items-center justify-between p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <div className="flex-1">
                  <p className="text-white truncate">{execution.prompt}</p>
                  <p className="text-sm text-slate-400">
                    {new Date(execution.startTime).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    execution.status === 'completed'
                      ? 'bg-green-900/50 text-green-400'
                      : execution.status === 'failed'
                      ? 'bg-red-900/50 text-red-400'
                      : execution.status === 'running'
                      ? 'bg-blue-900/50 text-blue-400'
                      : 'bg-slate-700 text-slate-400'
                  }`}>
                    {execution.status}
                  </span>
                  {execution.duration && (
                    <span className="text-sm text-slate-400">{execution.duration}ms</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-500">No executions yet</div>
          )}
        </div>
      </div>
    </div>
  );
}