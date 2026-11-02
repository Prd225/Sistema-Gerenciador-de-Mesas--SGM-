import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from '../../src/types/multiplayer';
import { registerSocketHandlers } from './handlers/socketHandlers';

import path from 'path';
import fs from 'fs';

const app = express();
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Cria diretório de mídia local do mestre se não existir
const uploadsDir = path.join(process.cwd(), 'server', 'uploads', 'handouts');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Servir arquivos estáticos locais para qualquer cliente da mesa
app.use('/uploads', express.static(path.join(process.cwd(), 'server', 'uploads')));

// Servir imagem direto de um caminho local do computador do mestre (ex: C:\Users\...\img.png)
app.get('/api/local-image', (req, res) => {
  try {
    const rawPath = String(req.query.path || '').trim().replace(/^["']|["']$/g, '');
    if (!rawPath) {
      return res.status(400).send('Parâmetro path ausente');
    }
    let cleaned = rawPath;
    if (cleaned.startsWith('file:///')) {
      cleaned = decodeURIComponent(cleaned.replace(/^file:\/\/\//, ''));
    } else if (cleaned.startsWith('file://')) {
      cleaned = decodeURIComponent(cleaned.replace(/^file:\/\//, ''));
    }
    const resolved = path.normalize(cleaned);
    if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
      return res.status(404).send('Imagem não encontrada no disco');
    }
    res.sendFile(resolved);
  } catch (err: any) {
    res.status(500).send(err.message || 'Erro ao servir imagem local');
  }
});

// Upload binário via stream direto para disco (sem limite de JSON, sem base64, zero consumo de RAM)
app.post('/api/handouts/upload-raw', (req, res) => {
  try {
    const id = (req.query.id as string) || (req.headers['x-file-id'] as string) || `${Date.now()}`;
    const rawName = (req.query.name as string) || (req.headers['x-file-name'] as string) || '';
    const name = decodeURIComponent(rawName);

    let ext = 'bin';
    if (name && name.includes('.')) {
      ext = name.split('.').pop() || 'bin';
    } else {
      const mime = req.headers['content-type'] || '';
      ext = mime.split('/')[1]?.split('+')[0] || 'bin';
    }

    // Sanitiza extensão contra caracteres inválidos
    ext = ext.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'bin';

    const filename = `${id}.${ext}`;
    const filePath = path.join(uploadsDir, filename);
    const writeStream = fs.createWriteStream(filePath);

    req.pipe(writeStream);

    writeStream.on('finish', () => {
      const relativeUrl = `/uploads/handouts/${filename}`;
      res.json({ success: true, url: relativeUrl, filename });
    });

    writeStream.on('error', (err) => {
      console.error('[Upload Handout Raw] Erro na gravação:', err);
      res.status(500).json({ error: 'Erro ao gravar arquivo no disco' });
    });
  } catch (err: any) {
    console.error('[Upload Handout Raw] Erro geral:', err);
    res.status(500).json({ error: err.message || 'Falha ao processar upload' });
  }
});

// Upload de arquivo local de handout vindo do mestre (legado/fallback)
app.post('/api/handouts/upload', (req, res) => {
  try {
    const { id, name, dataUrl } = req.body;
    if (!id || !dataUrl) {
      return res.status(400).json({ error: 'id e dataUrl são obrigatórios' });
    }

    const matches = dataUrl.match(/^data:([A-Za-z0-9-+\/.]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Formato dataUrl inválido' });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // Determina extensão a partir do nome original ou mimeType
    let ext = 'bin';
    if (name && name.includes('.')) {
      ext = name.split('.').pop() || 'bin';
    } else {
      ext = mimeType.split('/')[1]?.split('+')[0] || 'bin';
    }

    ext = ext.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'bin';

    const filename = `${id}.${ext}`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, buffer);

    const relativeUrl = `/uploads/handouts/${filename}`;
    res.json({ success: true, url: relativeUrl, filename });
  } catch (err: any) {
    console.error('[Upload Handout] Erro ao salvar arquivo:', err);
    res.status(500).json({ error: err.message || 'Falha ao processar upload' });
  }
});

// Exclusão de arquivo de handout do disco
app.delete('/api/handouts/:filename', (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(uploadsDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Falha ao excluir arquivo' });
  }
});

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
  // Aceita conexão WebSocket pura diretamente para latência ultra-baixa
  transports: ['websocket', 'polling'],
  // Heartbeat frequente a cada 5s para manter o túnel Cloudflare sempre aquecido e ativo
  pingInterval: 5000,
  pingTimeout: 15000,
  // Desativa compressão zlib em pacotes minúsculos (tokens/dados) para eliminar overhead e delay de buffer
  perMessageDeflate: false,
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
