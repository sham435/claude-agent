import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

interface TokenUpdate {
  modelId: string;
  tokensUsed: number;
  tokensRemaining: number;
  requestId: string;
}

interface TaskProgress {
  taskId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: any;
  error?: string;
}

interface ModelStats {
  modelId: string;
  totalRequests: number;
  totalTokens: number;
  avgResponseTime: number;
  successRate: number;
}

export function useWebSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [tokenUpdate, setTokenUpdate] = useState<TokenUpdate | null>(null);
  const [taskProgress, setTaskProgress] = useState<TaskProgress | null>(null);
  const [modelStats, setModelStats] = useState<ModelStats | null>(null);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('[WebSocket] Connected');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('[WebSocket] Disconnected');
      setConnected(false);
    });

    socket.on('token-update', (data: TokenUpdate) => {
      setTokenUpdate(data);
    });

    socket.on('task-progress', (data: TaskProgress) => {
      setTaskProgress(data);
    });

    socket.on('model-stats', (data: ModelStats) => {
      setModelStats(data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const joinRoom = useCallback((room: string) => {
    socketRef.current?.emit('join-room', room);
  }, []);

  return {
    connected,
    joinRoom,
    tokenUpdate,
    taskProgress,
    modelStats,
  };
}
