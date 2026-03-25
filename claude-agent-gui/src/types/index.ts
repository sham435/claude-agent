export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  toolCalls?: ToolCall[];
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  parameters: Parameter[];
}

export interface Parameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface ToolCall {
  id: string;
  toolId: string;
  toolName: string;
  parameters: Record<string, unknown>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string;
  startTime?: number;
}

export interface Execution {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: number;
  endTime?: number;
  duration?: number;
  toolCalls: ToolCall[];
}

export interface Settings {
  model: string;
  maxTokens: number;
  temperature: number;
  systemPrompt: string;
  autoScroll: boolean;
  showTimestamps: boolean;
}

export interface Stats {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  totalToolCalls: number;
  averageDuration: number;
}