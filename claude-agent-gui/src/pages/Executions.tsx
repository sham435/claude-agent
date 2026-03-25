import { useState } from 'react';
import { Activity, Clock, CheckCircle, XCircle, Loader2, ChevronRight, RefreshCw } from 'lucide-react';
import { useExecutionHistory } from '../hooks';
import type { Execution, ToolCall } from '../types';
import './Executions.css';

export default function Executions() {
  const { data: executions = [], isLoading, error, refetch } = useExecutionHistory();
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredExecutions = executions.filter(
    (exec) => statusFilter === 'all' || exec.status === statusFilter
  );

  const formatDuration = (ms?: number) => {
    if (!ms) return 'Running...';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getStatusIcon = (status: ToolCall['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={14} className="status-icon completed" />;
      case 'failed':
        return <XCircle size={14} className="status-icon failed" />;
      case 'running':
        return <Loader2 size={14} className="status-icon running" />;
      default:
        return <Clock size={14} className="status-icon pending" />;
    }
  };

  return (
    <div className="executions-page">
      <div className="page-header">
        <h1>Execution Monitor</h1>
        <p>Track and analyze agent executions</p>
      </div>

      <div className="executions-toolbar">
        <div className="status-filters">
          {['all', 'running', 'completed', 'failed'].map((status) => (
            <button
              key={status}
              className={`status-btn ${statusFilter === status ? 'active' : ''}`}
              onClick={() => setStatusFilter(status)}
            >
              {status === 'all' ? 'All' : status}
            </button>
          ))}
        </div>
        <button className="btn btn-secondary" onClick={() => refetch()}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="executions-content">
        <div className="executions-list">
          {isLoading ? (
            <div className="empty-state">
              <Activity size={48} className="empty-state-icon" />
              <p>Loading executions...</p>
            </div>
          ) : error ? (
            <div className="empty-state">
              <Activity size={48} className="empty-state-icon" />
              <p>Error loading executions</p>
            </div>
          ) : filteredExecutions.length === 0 ? (
            <div className="empty-state">
              <Activity size={48} className="empty-state-icon" />
              <p>No executions found</p>
            </div>
          ) : (
            filteredExecutions.map((exec) => (
              <div
                key={exec.id}
                className={`execution-card ${selectedExecution?.id === exec.id ? 'selected' : ''}`}
                onClick={() => setSelectedExecution(exec)}
              >
                <div className="execution-card-header">
                  <h3>{exec.name}</h3>
                  <ChevronRight size={18} className="expand-icon" />
                </div>
                <div className="execution-card-meta">
                  <span className={`execution-status ${exec.status}`}>
                    {exec.status === 'running' && <Loader2 size={12} className="spinner" />}
                    {exec.status}
                  </span>
                  <span className="execution-time">{formatTime(exec.startTime)}</span>
                </div>
                <div className="execution-card-stats">
                  <span>{exec.toolCalls.length} tools</span>
                  <span>{formatDuration(exec.duration)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {selectedExecution && (
          <div className="execution-detail">
            <div className="execution-detail-header">
              <h2>{selectedExecution.name}</h2>
              <span className={`execution-status ${selectedExecution.status}`}>
                {selectedExecution.status}
              </span>
            </div>

            <div className="execution-detail-stats">
              <div className="stat">
                <Clock size={16} />
                <div>
                  <span className="stat-label">Started</span>
                  <span className="stat-value">{formatTime(selectedExecution.startTime)}</span>
                </div>
              </div>
              <div className="stat">
                <Activity size={16} />
                <div>
                  <span className="stat-label">Duration</span>
                  <span className="stat-value">{formatDuration(selectedExecution.duration)}</span>
                </div>
              </div>
              <div className="stat">
                <Activity size={16} />
                <div>
                  <span className="stat-label">Tools Used</span>
                  <span className="stat-value">{selectedExecution.toolCalls.length}</span>
                </div>
              </div>
            </div>

            <div className="tool-calls-section">
              <h3>Tool Calls</h3>
              <div className="tool-calls-list">
                {selectedExecution.toolCalls.map((tc) => (
                  <div key={tc.id} className="tool-call-item">
                    <div className="tool-call-header">
                      {getStatusIcon(tc.status)}
                      <span className="tool-call-name">{tc.toolName}</span>
                    </div>
                    <div className="tool-call-details">
                      <div className="tool-call-params">
                        <span className="params-label">Parameters:</span>
                        <code>{JSON.stringify(tc.parameters, null, 2)}</code>
                      </div>
                      {tc.result && (
                        <div className="tool-call-result">
                          <span className="result-label">Result:</span>
                          <code>{tc.result}</code>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
