import { useState, useEffect, useCallback } from 'react';
import { useSettingsStore } from '../stores';
import { apiClient } from '../services/api';

interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  maxTokens: number;
  context: number;
  pricing: string;
  description: string;
}

interface ModelStats {
  totalRequests: number;
  totalTokens: number;
  avgResponseTime: number;
  successRate: number;
  lastRequest: string | null;
}

interface RequestHistory {
  id: string;
  model: string;
  prompt: string;
  tokens: number;
  timeMs: number;
  status: 'success' | 'failed';
  timestamp: string;
}

const AVAILABLE_MODELS: ModelInfo[] = [
  {
    id: 'mistralai/mistral-small-24b-instruct-2501:free',
    name: 'Mistral Small 3.1 24B',
    provider: 'Mistral',
    maxTokens: 128000,
    context: 128000,
    pricing: '$0/M',
    description: 'Free multimodal model with advanced reasoning',
  },
  {
    id: 'google/gemma-3-4b-it:free',
    name: 'Gemma 3 4B',
    provider: 'Google',
    maxTokens: 128000,
    context: 33000,
    pricing: '$0/M',
    description: 'Free efficient Gemma model',
  },
  {
    id: 'google/gemma-3-12b-it:free',
    name: 'Gemma 3 12B',
    provider: 'Google',
    maxTokens: 128000,
    context: 33000,
    pricing: '$0/M',
    description: 'Free efficient multimodal model',
  },
  {
    id: 'google/gemma-3-27b-it:free',
    name: 'Gemma 3 27B',
    provider: 'Google',
    maxTokens: 128000,
    context: 131000,
    pricing: '$0/M',
    description: 'Free multimodal Gemma model',
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'LLaMA 3.3 70B',
    provider: 'Meta',
    maxTokens: 128000,
    context: 66000,
    pricing: '$0/M',
    description: 'Free multilingual large language model',
  },
  {
    id: 'meta-llama/llama-3.2-3b-instruct:free',
    name: 'LLaMA 3.2 3B',
    provider: 'Meta',
    maxTokens: 128000,
    context: 131000,
    pricing: '$0/M',
    description: 'Lightweight multilingual model',
  },
  {
    id: 'nousresearch/hermes-3-llama-3.1-405b:free',
    name: 'Hermes 3 405B',
    provider: 'Nous Research',
    maxTokens: 128000,
    context: 131000,
    pricing: '$0/M',
    description: 'Frontier-level large model with advanced agentic capabilities',
  },
];

export default function ModelPanel() {
  const { settings, updateSettings } = useSettingsStore();
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [stats, setStats] = useState<ModelStats | null>(null);
  const [history, setHistory] = useState<RequestHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized && settings?.model) {
      setSelectedModel(settings.model || AVAILABLE_MODELS[0]?.id || '');
      setInitialized(true);
    } else if (!initialized && !settings?.model && AVAILABLE_MODELS[0]?.id) {
      setSelectedModel(AVAILABLE_MODELS[0].id);
      setInitialized(true);
    }
  }, [settings, initialized]);

  const fetchStats = useCallback(async () => {
    if (!selectedModel) {
      setStats({ totalRequests: 0, totalTokens: 0, avgResponseTime: 0, successRate: 0, lastRequest: null });
      return;
    }
    try {
      const data = await apiClient.getModelStats(selectedModel);
      if (data?.success) {
        setStats(data.data);
      } else {
        setStats({ totalRequests: 0, totalTokens: 0, avgResponseTime: 0, successRate: 0, lastRequest: null });
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setStats({ totalRequests: 0, totalTokens: 0, avgResponseTime: 0, successRate: 0, lastRequest: null });
    }
  }, [selectedModel]);

  const fetchHistory = useCallback(async () => {
    if (!selectedModel) {
      setHistory([]);
      return;
    }
    try {
      const data = await apiClient.getModelHistory(selectedModel);
      if (data?.success && data.data) {
        setHistory(data.data.slice(0, 20));
      } else {
        setHistory([]);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
      setHistory([]);
    }
  }, [selectedModel]);

  useEffect(() => {
    if (!selectedModel) return;
    fetchStats();
    fetchHistory();
    const interval = setInterval(() => {
      fetchStats();
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedModel, fetchStats, fetchHistory]);

  const handleModelChange = async (modelId: string) => {
    setSelectedModel(modelId);
    updateSettings({ model: modelId });
    setLoading(true);
    try {
      await apiClient.updateSettings({ model: modelId });
    } catch (err) {
      console.error('Failed to save model:', err);
    }
    setLoading(false);
  };

  const currentModel = AVAILABLE_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0] || { id: '', name: 'Select a model', provider: '', maxTokens: 0, context: 0, pricing: '', description: '' };

  return (
    <div className="models-panel">
      <div className="page-header">
        <h1>Model Selection</h1>
        <p className="subtitle">Choose and monitor LLM performance</p>
      </div>

      <div className="model-grid">
        <div className="model-selector">
          <h2>Available Models</h2>
          <div className="model-list">
            {AVAILABLE_MODELS.map((model) => (
              <button
                type="button"
                key={model.id}
                className={`model-card ${selectedModel === model.id ? 'active' : ''}`}
                onClick={() => handleModelChange(model.id)}
                disabled={loading}
              >
                <div className="model-header">
                  <span className="model-name">{model.name}</span>
                  <span className="model-provider">{model.provider}</span>
                </div>
                <div className="model-details">
                  <span>Context: {model.context.toLocaleString()}</span>
                  <span>Pricing: {model.pricing}</span>
                </div>
                <p className="model-description">{model.description}</p>
                {selectedModel === model.id && (
                  <span className="active-badge">Active</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="model-stats-panel">
          <h2>Model Statistics</h2>
          {selectedModel && (
            <div className="current-model-info">
              <div className="info-card">
                <h3>{currentModel.name}</h3>
                <p>{currentModel.description}</p>
                <div className="specs">
                  <div className="spec">
                    <span className="label">Provider</span>
                    <span className="value">{currentModel.provider}</span>
                  </div>
                  <div className="spec">
                    <span className="label">Context Window</span>
                    <span className="value">{currentModel.context.toLocaleString()}</span>
                  </div>
                  <div className="spec">
                    <span className="label">Max Output</span>
                    <span className="value">{currentModel.maxTokens.toLocaleString()}</span>
                  </div>
                  <div className="spec">
                    <span className="label">Pricing</span>
                    <span className="value">{currentModel.pricing}</span>
                  </div>
                </div>
              </div>

              {stats && (
                <div className="stats-grid">
                  <div className="stat-card">
                    <span className="stat-value">{stats.totalRequests}</span>
                    <span className="stat-label">Total Requests</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-value">{stats.totalTokens.toLocaleString()}</span>
                    <span className="stat-label">Total Tokens</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-value">{stats.avgResponseTime}ms</span>
                    <span className="stat-label">Avg Response</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-value">{stats.successRate}%</span>
                    <span className="stat-label">Success Rate</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="request-history">
        <h2>Request History</h2>
        {history.length > 0 ? (
          <table className="history-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Model</th>
                <th>Prompt</th>
                <th>Tokens</th>
                <th>Duration</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((req) => (
                <tr key={req.id}>
                  <td>{req.timestamp ? new Date(req.timestamp).toLocaleTimeString() : '-'}</td>
                  <td>{req.model?.split('/').pop() || req.model || '-'}</td>
                  <td className="prompt-cell">{(req.prompt || '').slice(0, 50)}...</td>
                  <td>{req.tokens || 0}</td>
                  <td>{req.timeMs || 0}ms</td>
                  <td>
                    <span className={`status ${req.status || 'unknown'}`}>
                      {req.status || 'unknown'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="no-history">No requests yet. Start chatting to see history.</p>
        )}
      </div>
    </div>
  );
}
