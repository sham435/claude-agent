import { create } from 'zustand';
import type { Message, Tool, Execution, Settings, Stats, ToolCall } from '../types';

interface AppState {
  messages: Message[];
  tools: Tool[];
  executions: Execution[];
  settings: Settings;
  stats: Stats;
  isConnected: boolean;
  currentExecution: Execution | null;
  addMessage: (message: Message) => void;
  setTools: (tools: Tool[]) => void;
  addExecution: (execution: Execution) => void;
  updateExecution: (id: string, updates: Partial<Execution>) => void;
  setSettings: (settings: Partial<Settings>) => void;
  setConnected: (connected: boolean) => void;
  setCurrentExecution: (execution: Execution | null) => void;
  addToolCall: (executionId: string, toolCall: ToolCall) => void;
  updateToolCall: (executionId: string, toolCallId: string, updates: Partial<ToolCall>) => void;
  clearMessages: () => void;
}

const defaultSettings: Settings = {
  model: 'mistralai/mistral-small-24b-instruct-2501:free',
  maxTokens: 4096,
  temperature: 0.7,
  systemPrompt: 'You are a helpful AI assistant.',
  autoScroll: true,
  showTimestamps: true,
};

const defaultStats: Stats = {
  totalExecutions: 0,
  successfulExecutions: 0,
  failedExecutions: 0,
  totalToolCalls: 0,
  averageDuration: 0,
};

export const useStore = create<AppState>((set) => ({
  messages: [],
  tools: [],
  executions: [],
  settings: defaultSettings,
  stats: defaultStats,
  isConnected: false,
  currentExecution: null,
  
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),
  
  setTools: (tools) => set({ tools }),
  
  addExecution: (execution) => set((state) => ({
    executions: [execution, ...state.executions],
    stats: {
      ...state.stats,
      totalExecutions: state.stats.totalExecutions + 1,
    },
  })),
  
  updateExecution: (id, updates) => set((state) => ({
    executions: state.executions.map((exec) =>
      exec.id === id ? { ...exec, ...updates } : exec
    ),
  })),
  
  setSettings: (settings) => set((state) => ({
    settings: { ...state.settings, ...settings },
  })),
  
  setConnected: (connected) => set({ isConnected: connected }),
  
  setCurrentExecution: (execution) => set({ currentExecution: execution }),
  
  addToolCall: (executionId, toolCall) => set((state) => ({
    executions: state.executions.map((exec) =>
      exec.id === executionId
        ? { ...exec, toolCalls: [...exec.toolCalls, toolCall] }
        : exec
    ),
    stats: {
      ...state.stats,
      totalToolCalls: state.stats.totalToolCalls + 1,
    },
  })),
  
  updateToolCall: (executionId, toolCallId, updates) => set((state) => ({
    executions: state.executions.map((exec) =>
      exec.id === executionId
        ? {
            ...exec,
            toolCalls: exec.toolCalls.map((tc) =>
              tc.id === toolCallId ? { ...tc, ...updates } : tc
            ),
          }
        : exec
    ),
  })),
  
  clearMessages: () => set({ messages: [] }),
}));
