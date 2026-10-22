import type { Server, Socket } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  RoomPing,
  RoomMember,
  SoundpadStatePayload,
  SoundpadControlPayload,
} from '../../../src/types/multiplayer';
import type { ActiveRoom } from '../roomManager';
import { roomManager } from '../roomManager';
import {
  toPlayerState,
  toPlayerToken,
  toPlayerTokenUpdates,
} from '../playerView';

type SgmSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type SgmServer = Server<ClientToServerEvents, ServerToClientEvents>;

/**
 * Permissões por papel.
 *
 * - Jogador: só pode mover tokens que já estão no mapa (`token:move`).
 * - Mestre: todo o resto (estado, tokens, iniciativa, fundo, soundpad...).
 *
 * O servidor é quem decide: o que o cliente esconde na interface não conta
 * como segurança, então cada evento do mestre confere o papel aqui.
 */

/** Jogadores podem sinalizar pontos no mapa? Hoje só o mestre. */
const PLAYER_CAN_PING = false;

interface Context {
  room: ActiveRoom;
  member: RoomMember;
}

const isFiniteNumber = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v);

function isValidSoundpadState(p: unknown): p is SoundpadStatePayload {
  if (!p || typeof p !== 'object') return false;
  const s = p as Partial<SoundpadStatePayload>;
  if (typeof s.isPlaying !== 'boolean') return false;
  if (!isFiniteNumber(s.positionSec)) return false;
  if (s.song === null) return true;
  return (
    !!s.song &&
    typeof s.song.id === 'string' &&
    typeof s.song.sourceUrl === 'string' &&
    (s.song.sourceType === 'local' ||
      s.song.sourceType === 'youtube' ||
      s.song.sourceType === 'spotify')
  );
}

function isValidSoundpadControl(p: unknown): p is SoundpadControlPayload {
  if (!p || typeof p !== 'object') return false;
  const c = p as Partial<SoundpadControlPayload>;
  return (
    (c.songId === null || typeof c.songId === 'string') &&
    typeof c.isPlaying === 'boolean' &&
    isFiniteNumber(c.positionSec)
  );
}

export function registerSocketHandlers(io: SgmServer, socket: SgmSocket) {
  function context(): Context | null {
    const room = roomManager.getRoomBySocketId(socket.id);
    const member = room?.members.get(socket.id);
    return room && member ? { room, member } : null;
  }

  /** Contexto do mestre; registra e ignora o evento se vier de um jogador. */
  function gmContext(event: string): Context | null {
    const ctx = context();
    if (!ctx) return null;
    if (ctx.member.role !== 'gm') {
      console.warn(
        `[Bloqueado] ${ctx.member.name} (jogador) tentou "${event}" na sala ${ctx.room.code}`,
      );
      return null;
    }
    return ctx;
  }

  // Criar Sala
  socket.on('room:create', ({ hostName }, callback) => {
    try {
      const room = roomManager.createRoom(socket.id, hostName);
      socket.join(room.code);
      callback({ success: true, code: room.code, hostToken: room.hostToken });
      console.log(
        `[Sala Criada] ${room.code} pelo mestre ${hostName} (${socket.id})`,
      );
    } catch (err: any) {
      callback({ success: false, error: err?.message || 'Erro ao criar sala' });
    }
  });

  // Entrar em Sala (jogador novo ou reconexão; mestre apresenta o hostToken)
  socket.on('room:join', ({ code, name, hostToken }, callback) => {
    try {
      const result = roomManager.joinRoom(code, socket.id, name, hostToken);
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
        members: roomManager.membersOf(room),
      });

      // O servidor já tem o estado da mesa: o jogador recebe tudo daqui,
      // sem depender de o mestre reenviar nada.
      callback({
        success: true,
        role: member.role,
        state: roomManager.toJoinState(room, member.role),
      });
      console.log(
        `[Entrou] ${member.name} (${member.role}) na sala ${room.code}`,
      );
    } catch (err: any) {
      callback({
        success: false,
        error: err?.message || 'Erro ao entrar na sala',
      });
    }
  });

  // Estado completo (mestre): atualiza a sala e repassa aos jogadores
  socket.on('room:sync-state', (payload) => {
    const ctx = gmContext('room:sync-state');
    if (!ctx) return;

    roomManager.syncFullState(ctx.room.code, payload);
    socket.to(ctx.room.code).emit('room:state-synced', toPlayerState(ctx.room));
  });

  // Movimento de Token (mestre e jogadores)
  socket.on('token:move', (payload) => {
    const ctx = context();
    if (!ctx) return;
    const { room, member } = ctx;

    const { tokenId, x, y } = payload ?? {};
    if (typeof tokenId !== 'string') return;

    if (member.role === 'player') {
      // Jogador: só números válidos e só token que já está no mapa.
      if (!isFiniteNumber(x) || !isFiniteNumber(y)) return;
      if (!roomManager.moveToken(room.code, tokenId, x, y, true)) return;
    } else {
      // Mestre: null tira o token do mapa.
      if ((x !== null && !isFiniteNumber(x)) || (y !== null && !isFiniteNumber(y))) {
        return;
      }
      if (!roomManager.moveToken(room.code, tokenId, x, y)) return;
    }

    socket.to(room.code).emit('token:moved', { tokenId, x, y });
  });

  // Atualização de Atributos/Status de Token (mestre)
  socket.on('token:update', ({ tokenId, updates }) => {
    const ctx = gmContext('token:update');
    if (!ctx) return;

    roomManager.updateToken(ctx.room.code, tokenId, updates);
    // Jogadores só recebem os campos públicos (nunca ficha/estatísticas).
    const publicUpdates = toPlayerTokenUpdates(updates);
    if (publicUpdates) {
      socket
        .to(ctx.room.code)
        .emit('token:updated', { tokenId, updates: publicUpdates });
    }
  });

  // Adição de Token (mestre)
  socket.on('token:add', ({ token }) => {
    const ctx = gmContext('token:add');
    if (!ctx) return;

    roomManager.addToken(ctx.room.code, token);
    socket
      .to(ctx.room.code)
      .emit('token:added', { token: toPlayerToken(token) });
  });

  // Remoção de Token (mestre)
  socket.on('token:remove', ({ tokenId }) => {
    const ctx = gmContext('token:remove');
    if (!ctx) return;

    roomManager.removeToken(ctx.room.code, tokenId);
    socket.to(ctx.room.code).emit('token:removed', { tokenId });
  });

  // Atualização da Fila de Iniciativa (mestre)
  socket.on('initiative:update', ({ queue, sortMode }) => {
    const ctx = gmContext('initiative:update');
    if (!ctx) return;

    roomManager.updateInitiative(ctx.room.code, queue, sortMode);
    socket.to(ctx.room.code).emit('initiative:updated', { queue, sortMode });
  });

  // Atualização de Rodada / Turno da Campanha (mestre)
  socket.on('campaign:update-round-turn', ({ round, turn }) => {
    const ctx = gmContext('campaign:update-round-turn');
    if (!ctx) return;

    roomManager.updateRoundTurn(ctx.room.code, round, turn);
    socket
      .to(ctx.room.code)
      .emit('campaign:round-turn-updated', { round, turn });
  });

  // Imagens de Fundo (mestre)
  socket.on('bg:add', ({ bg }) => {
    const ctx = gmContext('bg:add');
    if (!ctx) return;

    roomManager.addBgImage(ctx.room.code, bg);
    socket.to(ctx.room.code).emit('bg:added', { bg });
  });

  socket.on('bg:update', ({ bgId, updates }) => {
    const ctx = gmContext('bg:update');
    if (!ctx) return;

    roomManager.updateBgImage(ctx.room.code, bgId, updates);
    socket.to(ctx.room.code).emit('bg:updated', { bgId, updates });
  });

  socket.on('bg:remove', ({ bgId }) => {
    const ctx = gmContext('bg:remove');
    if (!ctx) return;

    roomManager.removeBgImage(ctx.room.code, bgId);
    socket.to(ctx.room.code).emit('bg:removed', { bgId });
  });

  // Soundpad (mestre): troca de faixa
  socket.on('soundpad:state', (payload) => {
    const ctx = gmContext('soundpad:state');
    if (!ctx || !isValidSoundpadState(payload)) return;

    roomManager.setSoundpadState(ctx.room.code, payload);
    socket.to(ctx.room.code).emit('soundpad:state', payload);
  });

  // Soundpad (mestre): play/pause/seek/batimento da faixa atual
  socket.on('soundpad:control', (payload) => {
    const ctx = gmContext('soundpad:control');
    if (!ctx || !isValidSoundpadControl(payload)) return;

    // Controle de outra faixa (mensagem atrasada) é descartado.
    if (!roomManager.applySoundpadControl(ctx.room.code, payload)) return;
    socket.to(ctx.room.code).emit('soundpad:control', payload);
  });

  // Ping Tático no Mapa
  socket.on('map:ping', ({ x, y }) => {
    const ctx = context();
    if (!ctx) return;
    if (ctx.member.role !== 'gm' && !PLAYER_CAN_PING) return;
    if (!isFiniteNumber(x) || !isFiniteNumber(y)) return;

    const ping: RoomPing = {
      id: `${socket.id}-${Date.now()}`,
      x,
      y,
      senderName: ctx.member.name,
      color: ctx.member.color || '#2ac7e3',
      createdAt: Date.now(),
    };

    io.to(ctx.room.code).emit('map:pinged', ping);
  });

  // Handouts (mestre): revelar ou ocultar um handout
  socket.on('handout:share-toggle', ({ handout, isShared }) => {
    const ctx = gmContext('handout:share-toggle');
    if (!ctx) return;
    if (!handout || typeof handout.id !== 'string') return;

    const updatedList = roomManager.updateSharedHandout(
      ctx.room.code,
      handout,
      Boolean(isShared),
    );
    io.to(ctx.room.code).emit('handout:shared-updated', {
      handouts: updatedList,
    });
  });

  // Handouts (mestre): sincronizar todos os compartilhados
  socket.on('handout:sync-shared', ({ handouts }) => {
    const ctx = gmContext('handout:sync-shared');
    if (!ctx) return;
    if (!Array.isArray(handouts)) return;

    roomManager.syncSharedHandouts(ctx.room.code, handouts);
    socket.to(ctx.room.code).emit('handout:shared-updated', { handouts });
  });

  // Projeção em Tempo Real (mestre): projetar ou encerrar projeção
  socket.on('projection:set', ({ handout }) => {
    const ctx = gmContext('projection:set');
    if (!ctx) return;

    const payload = roomManager.setProjection(ctx.room.code, handout);
    io.to(ctx.room.code).emit('projection:updated', payload);
    console.log(
      `[Projeção] ${handout ? `Projetando "${handout.title}"` : 'Projeção encerrada'} na sala ${ctx.room.code}`,
    );
  });

  // Sair da Sala (explícito)
  socket.on('room:leave', () => {
    handleLeave(true);
  });

  // Desconexão (queda de rede, fechar aba...)
  socket.on('disconnect', () => {
    handleLeave(false);
  });

  function handleLeave(explicit: boolean) {
    const ctx = context();
    if (!ctx) return;
    const { room, member } = ctx;

    // O mestre que sai de propósito encerra a mesa para todos. Uma queda de
    // conexão NÃO encerra: ele pode voltar com o hostToken.
    if (explicit && member.role === 'gm') {
      socket.to(room.code).emit('room:closed');
      io.in(room.code).socketsLeave(room.code);
      roomManager.closeRoom(room.code);
      console.log(`[Mesa Encerrada] ${room.code} pelo mestre`);
      return;
    }

    const result = roomManager.leaveRoom(socket.id);
    if (result) {
      socket.leave(room.code);
      socket.to(room.code).emit('room:member-left', { memberId: result.memberId });
      io.to(room.code).emit('room:members-updated', {
        members: roomManager.membersOf(result.room),
      });
      console.log(`[Saiu] ${member.name} (${member.role}) da sala ${room.code}`);
    }
  }
}
