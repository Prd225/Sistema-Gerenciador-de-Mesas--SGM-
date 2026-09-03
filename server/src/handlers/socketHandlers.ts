import type { Server, Socket } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  RoomPing,
} from '@sgm/shared';
import { roomManager } from '../roomManager';

type SgmSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type SgmServer = Server<ClientToServerEvents, ServerToClientEvents>;

export function registerSocketHandlers(io: SgmServer, socket: SgmSocket) {
  // Criar Sala
  socket.on('room:create', ({ hostName }, callback) => {
    try {
      const room = roomManager.createRoom(socket.id, hostName);
      socket.join(room.code);
      callback({ success: true, code: room.code });
      console.log(
        `[Sala Criada] ${room.code} pelo mestre ${hostName} (${socket.id})`,
      );
    } catch (err: any) {
      callback({ success: false, error: err?.message || 'Erro ao criar sala' });
    }
  });

  // Entrar em Sala
  socket.on('room:join', ({ code, name }, callback) => {
    try {
      const result = roomManager.joinRoom(code, socket.id, name);
      if (!result) {
        return callback({
          success: false,
          error: 'Sala não encontrada. Verifique o código.',
        });
      }

      const { room, member } = result;
      socket.join(room.code);

      // Notifica todos na sala que um membro novo entrou
      socket.to(room.code).emit('room:member-joined', { member });
      io.to(room.code).emit('room:members-updated', {
        members: Array.from(room.members.values()),
      });

      // Retorna estado completo para o novo jogador
      callback({ success: true, state: roomManager.toState(room) });
      console.log(`[Jogador Entrou] ${name} entrou na sala ${room.code}`);
    } catch (err: any) {
      callback({
        success: false,
        error: err?.message || 'Erro ao entrar na sala',
      });
    }
  });

  // Sincronizar Estado Completo (usado pelo mestre para atualizar o mapa inicial)
  socket.on('room:sync-state', (payload) => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room) return;

    roomManager.syncFullState(room.code, payload);
    // Repassa o estado completo para os outros jogadores conectados
    socket.to(room.code).emit('room:state-synced', payload);
  });

  // Movimento de Token
  socket.on('token:move', ({ tokenId, x, y }) => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room) return;

    roomManager.moveToken(room.code, tokenId, x, y);
    // Repassa imediatamente aos outros clientes da mesma sala
    socket.to(room.code).emit('token:moved', { tokenId, x, y });
  });

  // Atualização de Atributos/Status de Token
  socket.on('token:update', ({ tokenId, updates }) => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room) return;

    roomManager.updateToken(room.code, tokenId, updates);
    socket.to(room.code).emit('token:updated', { tokenId, updates });
  });

  // Adição de Token
  socket.on('token:add', ({ token }) => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room) return;

    roomManager.addToken(room.code, token);
    socket.to(room.code).emit('token:added', { token });
  });

  // Remoção de Token
  socket.on('token:remove', ({ tokenId }) => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room) return;

    roomManager.removeToken(room.code, tokenId);
    socket.to(room.code).emit('token:removed', { tokenId });
  });

  // Atualização de Fila de Iniciativa
  socket.on('initiative:update', ({ queue }) => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room) return;

    roomManager.updateInitiative(room.code, queue);
    socket.to(room.code).emit('initiative:updated', { queue });
  });

  // Atualização de Turno / Rodada da Campanha
  socket.on('campaign:update-round-turn', ({ round, turn }) => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room) return;

    roomManager.updateRoundTurn(room.code, round, turn);
    socket.to(room.code).emit('campaign:round-turn-updated', { round, turn });
  });

  // Background Images
  socket.on('bg:add', ({ bg }) => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room) return;

    roomManager.addBgImage(room.code, bg);
    socket.to(room.code).emit('bg:added', { bg });
  });

  socket.on('bg:update', ({ bgId, updates }) => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room) return;

    roomManager.updateBgImage(room.code, bgId, updates);
    socket.to(room.code).emit('bg:updated', { bgId, updates });
  });

  socket.on('bg:remove', ({ bgId }) => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room) return;

    roomManager.removeBgImage(room.code, bgId);
    socket.to(room.code).emit('bg:removed', { bgId });
  });

  // Zones
  socket.on('zone:add', ({ zone }) => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room) return;

    roomManager.addZone(room.code, zone);
    socket.to(room.code).emit('zone:added', { zone });
  });

  socket.on('zone:update', ({ zoneId, updates }) => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room) return;

    roomManager.updateZone(room.code, zoneId, updates);
    socket.to(room.code).emit('zone:updated', { zoneId, updates });
  });

  socket.on('zone:remove', ({ zoneId }) => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room) return;

    roomManager.removeZone(room.code, zoneId);
    socket.to(room.code).emit('zone:removed', { zoneId });
  });

  // Markers
  socket.on('marker:add', ({ marker }) => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room) return;

    roomManager.addMarker(room.code, marker);
    socket.to(room.code).emit('marker:added', { marker });
  });

  socket.on('marker:update', ({ markerId, updates }) => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room) return;

    roomManager.updateMarker(room.code, markerId, updates);
    socket.to(room.code).emit('marker:updated', { markerId, updates });
  });

  socket.on('marker:remove', ({ markerId }) => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room) return;

    roomManager.removeMarker(room.code, markerId);
    socket.to(room.code).emit('marker:removed', { markerId });
  });

  // Ping Tático no Mapa
  socket.on('map:ping', ({ x, y }) => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room) return;

    const member = room.members.get(socket.id);
    const ping: RoomPing = {
      id: Math.random().toString(36).substring(2, 9),
      x,
      y,
      senderName: member?.name || 'Alguém',
      color: member?.color || '#2ac7e3',
      createdAt: Date.now(),
    };

    // Pings vão para TODO MUNDO na sala (inclusive quem pingou, para confirmação visual)
    io.to(room.code).emit('map:pinged', ping);
  });

  // Sair da Sala
  socket.on('room:leave', () => {
    handleLeave(io, socket);
  });

  // Desconexão
  socket.on('disconnect', () => {
    handleLeave(io, socket);
  });
}

function handleLeave(io: SgmServer, socket: SgmSocket) {
  const result = roomManager.leaveRoom(socket.id);
  if (!result) return;

  const { room, memberId } = result;
  socket.leave(room.code);

  io.to(room.code).emit('room:member-left', { memberId });
  io.to(room.code).emit('room:members-updated', {
    members: Array.from(room.members.values()),
  });
  console.log(`[Desconexão] Socket ${socket.id} saiu da sala ${room.code}`);
}
