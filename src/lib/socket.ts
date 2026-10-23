import { io, Socket } from 'socket.io-client';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from '@/types/multiplayer';

// Determina dinamicamente a URL do servidor
const getSocketUrl = (): string => {
  const envServerUrl =
    typeof import.meta !== 'undefined' && import.meta.env
      ? (import.meta.env as Record<string, string | undefined>).VITE_SERVER_URL
      : undefined;
  if (envServerUrl) {
    return envServerUrl;
  }
  // No navegador (localhost, rede local ou túnel como Cloudflare),
  // conectamos na mesma origem para usar o proxy do Vite para a porta 3001
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:3001';
};

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  getSocketUrl(),
  {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 300,
    reconnectionDelayMax: 1500,
    randomizationFactor: 0.2,
    timeout: 8000,
    // Conecta diretamente via WebSocket sem esperar roundtrip de HTTP polling
    transports: ['websocket', 'polling'],
    upgrade: true,
  },
);
