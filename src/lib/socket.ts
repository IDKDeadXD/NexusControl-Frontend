import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function initSocket(): Socket {
  if (socket?.connected) {
    return socket;
  }

  const token = useAuthStore.getState().accessToken;

  socket = io(WS_URL, {
    auth: { token },
    transports: ['websocket'],
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.log('WebSocket connected');
  });

  socket.on('disconnect', (reason) => {
    console.log('WebSocket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('WebSocket connection error:', error.message);
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function subscribeToLogs(
  botId: string,
  onLog: (log: { botId: string; log: string; timestamp: string }) => void
): () => void {
  if (!socket) {
    initSocket();
  }

  socket?.emit('subscribe:logs', { botId });
  socket?.on('bot:log', onLog);

  return () => {
    socket?.emit('unsubscribe:logs', { botId });
    socket?.off('bot:log', onLog);
  };
}

export function subscribeToStatus(
  onStatus: (data: {
    botId: string;
    status: string;
    containerId?: string;
    timestamp: string;
  }) => void
): () => void {
  if (!socket) {
    initSocket();
  }

  socket?.emit('subscribe:status');
  socket?.on('bot:status', onStatus);

  return () => {
    socket?.emit('unsubscribe:status');
    socket?.off('bot:status', onStatus);
  };
}
