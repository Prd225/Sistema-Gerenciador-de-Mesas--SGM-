import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@sgm/shared';

// Determina dinamicamente a URL do servidor
const getSocketUrl = (): string => {
  // @ts-ignore
  if (import.meta.env.VITE_SERVER_URL) {
    // @ts-ignore
    return import.meta.env.VITE_SERVER_URL;
  }
  // Em desenvolvimento local
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1')
  ) {
    return 'http://localhost:3001';
  }
  // Em produção no mesmo domínio
  return typeof window !== 'undefined'
    ? window.location.origin
    : 'http://localhost:3001';
};

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  getSocketUrl(),
  {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  },
);
