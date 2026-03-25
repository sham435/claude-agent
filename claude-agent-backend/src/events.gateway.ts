import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:5174', 'http://localhost:4175'],
    credentials: true,
  },
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  afterInit() {
    console.log('[WebSocket] Gateway initialized');
  }

  handleConnection(client: Socket) {
    console.log(`[WebSocket] Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[WebSocket] Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(client: Socket, room: string) {
    client.join(room);
    console.log(`[WebSocket] Client ${client.id} joined room: ${room}`);
    return { event: 'joined', room };
  }

  emitTokenUpdate(data: {
    modelId: string;
    tokensUsed: number;
    tokensRemaining: number;
    requestId: string;
  }) {
    this.server.emit('token-update', data);
  }

  emitTaskProgress(data: {
    taskId: string;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    progress: number;
    result?: any;
    error?: string;
  }) {
    this.server.emit('task-progress', data);
  }

  emitModelStats(data: {
    modelId: string;
    totalRequests: number;
    totalTokens: number;
    avgResponseTime: number;
    successRate: number;
  }) {
    this.server.emit('model-stats', data);
  }
}
