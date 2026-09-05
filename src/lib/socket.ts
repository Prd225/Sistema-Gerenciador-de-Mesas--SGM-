import { io, Socket } from 'socket.io-client';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from '@/types/multiplayer';

// Determina dinamicamente a URL do servidor
const getSocketUrl = (): string => {
  // @ts-ignore
  if (import.meta.env.VITE_SERVER_URL) {
    // @ts-ignore
    return import.meta.env.VITE_SERVER_URL;
  }
  // Se estiver acessando via browser (seja localhost, IP local ou rede externa)
  if (typeof window !== 'undefined') {
    return `http://${window.location.hostname}:3001`;
  }
  return 'http://localhost:3001';
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
