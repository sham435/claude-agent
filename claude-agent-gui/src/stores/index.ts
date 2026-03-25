import { create } from 'zustand';
import type { AgentStatus, ExecutionRecord, ChatMessage, Project, AgentSettings, UIState } from '../types';

interface AgentStore {
  status: AgentStatus | null;
  isRunning: boolean;
  currentExecution: ExecutionRecord | null;
  executionHistory: ExecutionRecord[];
  setStatus: (status: AgentStatus) => void;
  setRunning: (running: boolean) => void;
  setCurrentExecution: (execution: ExecutionRecord | null) => void;
  addToHistory: (execution: ExecutionRecord) => void;
  clearHistory: () => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  status: null,
  isRunning: false,
  currentExecution: null,
  executionHistory: [],
  setStatus: (status) => set({ status }),
  setRunning: (running) => set({ isRunning: running }),
  setCurrentExecution: (execution) => set({ currentExecution: execution }),
  addToHistory: (execution) =>
    set((state) => ({
      executionHistory: [execution, ...state.executionHistory].slice(0, 100),
    })),
  clearHistory: () => set({ executionHistory: [] }),
}));

interface ChatStore {
  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  updateMessage: (id: string, message: Partial<ChatMessage>) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  clearMessages: () => set({ messages: [] }),
  updateMessage: (id, message) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, ...message } : msg
      ),
    })),
}));

interface ProjectStore {
  projects: Project[];
  selectedProject: Project | null;
  setProjects: (projects: Project[]) => void;
  selectProject: (project: Project) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  removeProject: (id: string) => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],
  selectedProject: null,
  setProjects: (projects) => set({ projects }),
  selectProject: (project) => set({ selectedProject: project }),
  addProject: (project) =>
    set((state) => ({
      projects: [...state.projects, project],
    })),
  updateProject: (id, updates) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })),
  removeProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
    })),
}));

interface SettingsStore {
  settings: AgentSettings | null;
  setSettings: (settings: AgentSettings) => void;
  updateSettings: (updates: Partial<AgentSettings>) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: null,
  setSettings: (settings) => set({ settings }),
  updateSettings: (updates) =>
    set((state) => ({
      settings: state.settings ? { ...state.settings, ...updates } : null,
    })),
}));

export const useUIStore = create<UIState & {
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSelectedProject: (id?: string) => void;
  setSelectedExecution: (id?: string) => void;
  setShowSettings: (show: boolean) => void;
  incrementNotifications: () => void;
  clearNotifications: () => void;
}>((set) => ({
  sidebarOpen: true,
  selectedProject: undefined,
  selectedExecution: undefined,
  showSettings: false,
  notificationCount: 0,
  toggleSidebar: () =>
    set((state) => ({
      sidebarOpen: !state.sidebarOpen,
    })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSelectedProject: (id) => set({ selectedProject: id }),
  setSelectedExecution: (id) => set({ selectedExecution: id }),
  setShowSettings: (show) => set({ showSettings: show }),
  incrementNotifications: () =>
    set((state) => ({
      notificationCount: state.notificationCount + 1,
    })),
  clearNotifications: () => set({ notificationCount: 0 }),
}));

interface LoadingStore {
  isLoading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useLoadingStore = create<LoadingStore>((set) => ({
  isLoading: false,
  error: null,
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));