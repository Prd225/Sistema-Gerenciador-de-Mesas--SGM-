import { create } from 'zustand';
import type { RoomMember, RoomPing, UserRole } from '@/types/multiplayer';
import { socket } from '../lib/socket';
import { useTokenStore } from './useTokenStore';
import { useZoneStore } from './useZoneStore';
import { useCampaignStore } from './useCampaignStore';

interface MultiplayerState {
  isConnected: boolean;
  roomId: string | null;
  role: UserRole | null;
  userName: string;
  members: RoomMember[];
  pings: RoomPing[];
  isModalOpen: boolean;
  error: string | null;

  // UI
  setIsModalOpen: (open: boolean) => void;
  setError: (err: string | null) => void;

  // Ações de Sala
  createRoom: (hostName: string) => Promise<string>;
  joinRoom: (code: string, name: string) => Promise<boolean>;
  leaveRoom: () => void;
  sendPing: (x: number, y: number) => void;
  syncStateToRoom: () => void;
}

// Inicializa listeners do socket
function setupSocketListeners(set: any, get: any) {
  socket.on('connect', () => {
    set({ isConnected: true, error: null });
  });

  socket.on('disconnect', () => {
    set({ isConnected: false });
  });

  socket.on('room:members-updated', ({ members }) => {
    set({ members });
  });

  socket.on('room:member-joined', ({ member }) => {
    const currentMembers = get().members;
    if (!currentMembers.find((m: RoomMember) => m.id === member.id)) {
      set({ members: [...currentMembers, member] });
    }

    // Se sou o Mestre e alguém entrou, envio o estado atual da mesa para o novo jogador
    if (get().role === 'gm') {
      const tokens = useTokenStore.getState().tokens;
      const initiativeQueue = useTokenStore.getState().initiativeQueue;
      const { bgImages, zones, markers } = useZoneStore.getState();
      const { round, turn } = useCampaignStore.getState();

      socket.emit('room:sync-state', {
        tokens,
        initiativeQueue,
        bgImages,
        zones,
        markers,
        round,
        turn,
      });
    }
  });

  socket.on('room:member-left', ({ memberId }) => {
    const members = get().members.filter((m: RoomMember) => m.id !== memberId);
    set({ members });
  });

  // Pings no mapa
  socket.on('map:pinged', (ping) => {
    set((state: MultiplayerState) => ({
      pings: [...state.pings, ping],
    }));

    // Remove o ping após 3.5 segundos
    setTimeout(() => {
      set((state: MultiplayerState) => ({
        pings: state.pings.filter((p) => p.id !== ping.id),
      }));
    }, 3500);
  });

  // Sincronização completa vinda do servidor
  socket.on('room:state-synced', (payload) => {
    useTokenStore.setState({
      tokens: payload.tokens || [],
      initiativeQueue: payload.initiativeQueue || [],
    });
    useZoneStore.setState({
      bgImages: payload.bgImages || [],
      zones: payload.zones || {},
      markers: payload.markers || {},
    });
    if (payload.round !== undefined && payload.turn !== undefined) {
      useCampaignStore
        .getState()
        .setRoundTurnFromRemote(payload.round, payload.turn);
    }
  });

  // Eventos de Tokens
  socket.on('token:moved', ({ tokenId, x, y }) => {
    useTokenStore.getState().updateTokenFromRemote(tokenId, { x, y });
  });

  socket.on('token:updated', ({ tokenId, updates }) => {
    useTokenStore.getState().updateTokenFromRemote(tokenId, updates);
  });

  socket.on('token:added', ({ token }) => {
    useTokenStore.getState().addTokenFromRemote(token);
  });

  socket.on('token:removed', ({ tokenId }) => {
    useTokenStore.getState().removeTokenFromRemote(tokenId);
  });

  // Iniciativa
  socket.on('initiative:updated', ({ queue }) => {
    useTokenStore.getState().setInitiativeQueueFromRemote(queue);
  });

  // Rodada e Turno
  socket.on('campaign:round-turn-updated', ({ round, turn }) => {
    useCampaignStore.getState().setRoundTurnFromRemote(round, turn);
  });

  // Background Images
  socket.on('bg:added', ({ bg }) => {
    useZoneStore.getState().addBgImageFromRemote(bg);
  });

  socket.on('bg:updated', ({ bgId, updates }) => {
    useZoneStore.getState().updateBgImageFromRemote(bgId, updates);
  });

  socket.on('bg:removed', ({ bgId }) => {
    useZoneStore.getState().removeBgImageFromRemote(bgId);
  });

  // Zonas
  socket.on('zone:added', ({ zone }) => {
    useZoneStore.getState().addZoneFromRemote(zone);
  });

  socket.on('zone:updated', ({ zoneId, updates }) => {
    useZoneStore.getState().updateZoneFromRemote(zoneId, updates);
  });

  socket.on('zone:removed', ({ zoneId }) => {
    useZoneStore.getState().removeZoneFromRemote(zoneId);
  });

  // Marcadores
  socket.on('marker:added', ({ marker }) => {
    useZoneStore.getState().addMarkerFromRemote(marker);
  });

  socket.on('marker:updated', ({ markerId, updates }) => {
    useZoneStore.getState().updateMarkerFromRemote(markerId, updates);
  });

  socket.on('marker:removed', ({ markerId }) => {
    useZoneStore.getState().removeMarkerFromRemote(markerId);
  });
}

export const useMultiplayerStore = create<MultiplayerState>((set, get) => {
  setupSocketListeners(set, get);

  return {
    isConnected: false,
    roomId: null,
    role: null,
    userName: '',
    members: [],
    pings: [],
    isModalOpen: false,
    error: null,

    setIsModalOpen: (isModalOpen) => set({ isModalOpen, error: null }),
    setError: (error) => set({ error }),

    createRoom: (hostName: string) => {
      return new Promise((resolve, reject) => {
        set({ error: null });

        if (!socket.connected) {
          socket.connect();
        }

        socket.emit(
          'room:create',
          { hostName: hostName.trim() || 'Mestre' },
          (res) => {
            if (res.success && res.code) {
              set({
                roomId: res.code,
                role: 'gm',
                userName: hostName.trim() || 'Mestre',
                isConnected: true,
              });

              // Envia o estado completo inicial da mesa
              get().syncStateToRoom();
              resolve(res.code);
            } else {
              const err = res.error || 'Falha ao criar sala';
              set({ error: err });
              reject(new Error(err));
            }
          },
        );
      });
    },

    joinRoom: (code: string, name: string) => {
      return new Promise((resolve, reject) => {
        set({ error: null });

        if (!socket.connected) {
          socket.connect();
        }

        const cleanCode = code.trim().toUpperCase();
        const cleanName = name.trim() || 'Jogador';

        socket.emit(
          'room:join',
          { code: cleanCode, name: cleanName },
          (res) => {
            if (res.success && res.state) {
              const { state } = res;
              set({
                roomId: cleanCode,
                role: 'player',
                userName: cleanName,
                members: state.members || [],
                isConnected: true,
                isModalOpen: false,
              });

              // Aplica o estado recebido do mestre nos stores locais
              useTokenStore.setState({
                tokens: state.tokens || [],
                initiativeQueue: state.initiativeQueue || [],
              });
              useZoneStore.setState({
                bgImages: state.bgImages || [],
                zones: state.zones || {},
                markers: state.markers || {},
              });
              if (state.round !== undefined && state.turn !== undefined) {
                useCampaignStore
                  .getState()
                  .setRoundTurnFromRemote(state.round, state.turn);
              }

              resolve(true);
            } else {
              const err =
                res.error || 'Falha ao entrar na sala. Verifique o código.';
              set({ error: err });
              reject(new Error(err));
            }
          },
        );
      });
    },

    leaveRoom: () => {
      if (socket.connected) {
        socket.emit('room:leave');
        socket.disconnect();
      }
      set({
        isConnected: false,
        roomId: null,
        role: null,
        members: [],
        pings: [],
      });
    },

    sendPing: (x: number, y: number) => {
      if (!socket.connected || !get().roomId) return;
      socket.emit('map:ping', { x, y });
    },

    syncStateToRoom: () => {
      if (!socket.connected || !get().roomId) return;
      const tokens = useTokenStore.getState().tokens;
      const initiativeQueue = useTokenStore.getState().initiativeQueue;
      const { bgImages, zones, markers } = useZoneStore.getState();
      const { round, turn } = useCampaignStore.getState();

      socket.emit('room:sync-state', {
        tokens,
        initiativeQueue,
        bgImages,
        zones,
        markers,
        round,
        turn,
      });
    },
  };
});
