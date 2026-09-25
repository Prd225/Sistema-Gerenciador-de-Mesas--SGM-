import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import type { ClientToServerEvents, ServerToClientEvents } from '@sgm/shared';
import { registerSocketHandlers } from './handlers/socketHandlers';
import { initDatabase, getDatabaseStatus } from './db/db';
import { authRouter } from './routes/authRoutes';

const app = express();
app.use(cors());
app.use(express.json());

// Endpoint de health check para container e monitoramento
app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Rotas de Autenticacao e Usuarios
app.use('/api/auth', authRouter);

// Rota de status do servidor e banco de dados
app.get('/health', (_req, res) => {
  res.json({
    status: 'online',
    version: '7.0.0',
    database: getDatabaseStatus() ? 'connected' : 'offline',
    timestamp: new Date().toISOString(),
  });
});

// Servir arquivos estaticos do frontend quando o build existir (producao / container)
const clientDistCandidates = [
  path.resolve(process.cwd(), 'apps/web/dist'),
  path.resolve(process.cwd(), '../web/dist'),
  path.resolve(process.cwd(), 'dist'),
];
const clientDistPath = clientDistCandidates.find((dir) => fs.existsSync(dir));

if (clientDistPath) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 30000,
  pingInterval: 10000,
  maxHttpBufferSize: 2e7, // 20 MB para suportar imagens e mapas de batalha em alta resolucao
});

io.on('connection', (socket) => {
  console.log(`[Conexao Conectada] Socket ID: ${socket.id}`);
  registerSocketHandlers(io, socket);
});

const PORT = Number(process.env.PORT) || 3001;

httpServer.listen(PORT, async () => {
  console.log(`Servidor SGM Online rodando na porta ${PORT}`);
  console.log(`WebSocket pronto para conexoes em ws://localhost:${PORT}`);
  await initDatabase();
});
