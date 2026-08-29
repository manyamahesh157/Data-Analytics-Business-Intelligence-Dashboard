import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function connectSocket(token: string): Socket {
  if (socket && socket.connected) {
    return socket;
  }

  socket = io('/', {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('[WebSocket] Connected successfully to BI event stream.');
  });

  socket.on('disconnect', () => {
    console.log('[WebSocket] Disconnected from BI event stream.');
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
