export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';

export const EXECUTION_STATUSES = [
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
] as const;

export const TOOL_CATEGORIES = [
  'file-system',
  'code-execution',
  'git',
  'package-management',
  'code-analysis',
] as const;

export const MODELS = [
  'claude-3-sonnet-20240229',
  'claude-3-opus-20240229',
  'claude-3-haiku-20240307',
] as const;

export const DEFAULT_SETTINGS = {
  model: 'claude-3-sonnet-20240229',
  maxTokens: 4096,
  maxRetries: 3,
  timeout: 30000,
  theme: 'dark' as const,
  autoScroll: true,
  showTimestamps: true,
};