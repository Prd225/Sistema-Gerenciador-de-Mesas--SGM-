import { create } from 'zustand';
import type { RoomMember, RoomPing, UserRole } from '@sgm/shared';
import { socket } from '../lib/socket';
import { useTokenStore } from './useTokenStore';
import { useZoneStore } from './useZoneStore';
import { useCampaignStore } from './useCampaignStore';
import { useAudioStore } from './useAudioStore';

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
      useCampaignStore.setState({
        round: payload.round,
        turn: payload.turn,
      });
    }
  });

  // Tokens
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

  socket.on('initiative:updated', ({ queue }) => {
    useTokenStore.getState().setInitiativeQueueFromRemote(queue);
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

  // Zones
  socket.on('zone:added', ({ zone }) => {
    useZoneStore.getState().addZoneFromRemote(zone);
  });

  socket.on('zone:updated', ({ zoneId, updates }) => {
    useZoneStore.getState().updateZoneFromRemote(zoneId, updates);
  });

  socket.on('zone:removed', ({ zoneId }) => {
    useZoneStore.getState().removeZoneFromRemote(zoneId);
  });

  // Markers
  socket.on('marker:added', ({ marker }) => {
    useZoneStore.getState().addMarkerFromRemote(marker);
  });

  socket.on('marker:updated', ({ markerId, updates }) => {
    useZoneStore.getState().updateMarkerFromRemote(markerId, updates);
  });

  socket.on('marker:removed', ({ markerId }) => {
    useZoneStore.getState().removeMarkerFromRemote(markerId);
  });

  // Campaign Round / Turn
  socket.on('campaign:round-turn-updated', ({ round, turn }) => {
    useCampaignStore.getState().setRoundTurnFromRemote(round, turn);
  });
}

export const useMultiplayerStore = create<MultiplayerState>((set, get) => {
  // Configura listeners uma única vez
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
      return new Promise<string>((resolve, reject) => {
        if (!socket.connected) {
          socket.connect();
        }

        socket.emit('room:create', { hostName }, (response) => {
          if (response.success && response.code) {
            set({
              roomId: response.code,
              role: 'gm',
              userName: hostName || 'Mestre',
              error: null,
            });

            // Sincroniza o estado atual completo da mesa
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

            resolve(response.code);
          } else {
            const err = response.error || 'Erro ao criar sala';
            set({ error: err });
            reject(new Error(err));
          }
        });
      });
    },

    joinRoom: (code: string, name: string) => {
      return new Promise<boolean>((resolve, reject) => {
        if (!socket.connected) {
          socket.connect();
        }

        socket.emit('room:join', { code, name }, (response) => {
          if (response.success && response.state) {
            set({
              roomId: response.state.code,
              role: 'player',
              userName: name,
              members: response.state.members,
              error: null,
            });

            // Atualiza os dados locais com o que veio da sala
            useTokenStore.setState({
              tokens: response.state.tokens || [],
              initiativeQueue: response.state.initiativeQueue || [],
            });
            useZoneStore.setState({
              bgImages: response.state.bgImages || [],
              zones: response.state.zones || {},
              markers: response.state.markers || {},
            });
            if (
              response.state.round !== undefined &&
              response.state.turn !== undefined
            ) {
              useCampaignStore.setState({
                round: response.state.round,
                turn: response.state.turn,
              });
            }
            if (response.state.audio) {
              useAudioStore.getState().syncFromRemote(response.state.audio);
            }

            resolve(true);
          } else {
            const err = response.error || 'Não foi possível entrar na sala';
            set({ error: err });
            reject(new Error(err));
          }
        });
      });
    },

    leaveRoom: () => {
      socket.emit('room:leave');
      socket.disconnect();
      set({
        roomId: null,
        role: null,
        members: [],
        pings: [],
        isConnected: false,
        error: null,
      });
    },

    sendPing: (x: number, y: number) => {
      if (get().roomId) {
        socket.emit('map:ping', { x, y });
      }
    },

    syncStateToRoom: () => {
      if (get().roomId && get().role === 'gm') {
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
    },
  };
});
