import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../services/api';
import type { AgentStatus, ExecutionRecord, Tool, Project, AgentSettings, ExecutionStats } from '../types';
import { useAgentStore, useLoadingStore } from '../stores';

export const useAgentStatus = () => {
  const setStatus = useAgentStore((state) => state.setStatus);
  const setError = useLoadingStore((state) => state.setError);

  return useQuery({
    queryKey: ['agent', 'status'],
    queryFn: async () => {
      try {
        const status = await apiClient.getAgentStatus();
        setStatus(status);
        return status;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch status';
        setError(message);
        throw error;
      }
    },
    refetchInterval: 5000,
    enabled: true,
  });
};

export const useRunAgent = () => {
  const queryClient = useQueryClient();
  const setRunning = useAgentStore((state) => state.setRunning);
  const addToHistory = useAgentStore((state) => state.addToHistory);
  const setLoading = useLoadingStore((state) => state.setLoading);
  const setError = useLoadingStore((state) => state.setError);

  return useMutation({
    mutationFn: async (prompt: string) => {
      try {
        setRunning(true);
        setLoading(true);
        const execution = await apiClient.runAgent(prompt);
        addToHistory(execution);
        return execution;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to run agent';
        setError(message);
        throw error;
      } finally {
        setRunning(false);
        setLoading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent', 'history'] });
      queryClient.invalidateQueries({ queryKey: ['agent', 'stats'] });
    },
  });
};

export const useExecutionHistory = (limit: number = 50) => {
  return useQuery({
    queryKey: ['agent', 'history', limit],
    queryFn: () => apiClient.getExecutionHistory(limit),
    refetchInterval: 10000,
  });
};

export const useAgentStats = () => {
  return useQuery({
    queryKey: ['agent', 'stats'],
    queryFn: () => apiClient.getAgentStats(),
    refetchInterval: 30000,
  });
};

export const useAllTools = () => {
  return useQuery({
    queryKey: ['tools', 'all'],
    queryFn: () => apiClient.getAllTools(),
    refetchInterval: 60000,
  });
};

export const useTool = (name: string) => {
  return useQuery({
    queryKey: ['tools', name],
    queryFn: () => apiClient.getTool(name),
    enabled: !!name,
  });
};

export const useTestTool = () => {
  return useMutation({
    mutationFn: ({ toolName, input }: { toolName: string; input: Record<string, unknown> }) =>
      apiClient.testTool(toolName, input),
  });
};

export const useProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => apiClient.getProjects(),
    refetchInterval: 30000,
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, path, description }: { name: string; path: string; description?: string }) =>
      apiClient.createProject(name, path, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Project> }) =>
      apiClient.updateProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useSettings = () => {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => apiClient.getSettings(),
  });
};

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: Partial<AgentSettings>) => apiClient.updateSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
};

export const useWebSocket = (url: string = import.meta.env.VITE_WS_URL || 'ws://localhost:3000') => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<unknown>(null);

  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => setIsConnected(true);
    ws.onmessage = (event) => {
      try {
        setLastMessage(JSON.parse(event.data));
      } catch {
        setLastMessage(event.data);
      }
    };
    ws.onclose = () => setIsConnected(false);

    return () => ws.close();
  }, [url]);

  const send = useCallback(
    (message: unknown) => {
      if (isConnected) {
        const ws = new WebSocket(url);
        ws.send(JSON.stringify(message));
      }
    },
    [isConnected, url]
  );

  return { isConnected, lastMessage, send };
};

export const useExecutionPolling = (executionId: string | undefined) => {
  return useQuery({
    queryKey: ['executions', executionId],
    queryFn: () => {
      if (!executionId) throw new Error('No execution ID');
      return apiClient.getExecution(executionId);
    },
    refetchInterval: (data) => {
      if (!data) return 5000;
      const status = (data as ExecutionRecord).status;
      if (status === 'completed' || status === 'failed' || status === 'cancelled') return false;
      return 2000;
    },
    enabled: !!executionId,
  });
};

export const useCancelExecution = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (executionId: string) => apiClient.cancelExecution(executionId),
    onSuccess: (_, executionId) => {
      queryClient.invalidateQueries({ queryKey: ['executions', executionId] });
    },
  });
};

export const useHealthCheck = () => {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => apiClient.healthCheck(),
    refetchInterval: 30000,
  });
};