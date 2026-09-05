import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from '../../src/types/multiplayer';
import { registerSocketHandlers } from './handlers/socketHandlers';

const app = express();
app.use(cors());
app.use(express.json());

// Rota de status do servidor
app.get('/health', (_req, res) => {
  res.json({
    status: 'online',
    version: '7.0.0',
    timestamp: new Date().toISOString(),
  });
});

const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 30000,
  pingInterval: 10000,
  maxHttpBufferSize: 2e7, // 20 MB para suportar imagens e mapas de batalha em alta resolução
});

io.on('connection', (socket) => {
  console.log(`[Conexão Conectada] Socket ID: ${socket.id}`);
  registerSocketHandlers(io, socket);
});

const PORT = Number(process.env.PORT) || 3001;

httpServer.listen(PORT, () => {
  console.log(`🎲 Servidor SGM Online rodando na porta ${PORT}`);
  console.log(`👉 WebSocket pronto para conexões em ws://localhost:${PORT}`);
});
