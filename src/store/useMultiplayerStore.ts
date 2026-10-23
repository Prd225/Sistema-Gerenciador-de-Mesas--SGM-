import { create } from 'zustand';
import type {
  RoomMember,
  RoomPing,
  UserRole,
  PlayerStatePayload,
  PlayerTokenView,
} from '@/types/multiplayer';
import type { Token } from '@/types/game';
import { socket } from '@/lib/socket';
import {
  readRoomSession,
  writeRoomSession,
  clearRoomSession,
  setCurrentRole,
  isPlayerMode,
  isLocalStateReady,
} from '@/lib/roomRole';
import { triggerAutoSave } from '@/lib/saveHelpers';
import { useTokenStore } from './useTokenStore';
import { useZoneStore } from './useZoneStore';
import { useCampaignStore } from './useCampaignStore';
import { usePlayerAudioStore } from './usePlayerAudioStore';
import { usePlayerHandoutsStore } from './usePlayerHandoutsStore';
import { useFogStore } from './useFogStore';
import { broadcastCurrentSoundpad } from '@/lib/soundpadBroadcast';

export function hydratePlayerToken(view: PlayerTokenView): Token {
  return {
    id: view.id,
    name: view.name,
    fullName: view.fullName,
    colorText: view.colorText,
    colorBorder: view.colorBorder,
    colorFill: view.colorFill,
    x: view.x,
    y: view.y,
    imageUrl: view.imageUrl,
    desc: '',
    conditions: (view.conditions || []).map((c) => ({
      name: c.name,
      desc: '',
      color: c.color,
      type: c.type,
      durationTurns: c.durationTurns,
    })),
    stats: {
      type: 'player',
      system: 'san',
      agi: 0,
      for: 0,
      int: 0,
      pre: 0,
      vig: 0,
      def: 0,
      bloq: 0,
      esq: 0,
      pv: 0,
      maxPv: 0,
      pe: 0,
      maxPe: 0,
      san: 0,
      maxSan: 0,
      pd: 0,
      maxPd: 0,
    },
  };
}

function applyPlayerView(view: PlayerStatePayload) {
  useTokenStore.setState({
    tokens: (view.tokens || []).map(hydratePlayerToken),
    initiativeQueue: view.initiativeQueue || [],
    initiativeSortMode: view.initiativeSortMode || 'descending',
  });
  useZoneStore.setState({
    bgImages: view.bgImages || [],
    zones: {},
    markers: {},
    activeTool: 'pan',
    selectedZoneId: null,
    selectedMarkerId: null,
    selectedNodeIds: [],
  });
  if (view.round !== undefined && view.turn !== undefined) {
    useCampaignStore
      .getState()
      .setRoundTurnFromRemote(view.round, view.turn, view.scene);
  }
  if (view.fog) {
    useFogStore.getState().applyState(view.fog);
  } else {
    useFogStore.getState().applyState({
      enabled: false,
      defaultCovered: false,
      areas: [],
    });
  }
}

interface MultiplayerState {
  isConnected: boolean;
  isReconnecting: boolean;
  isRoomClosed: boolean;
  roomId: string | null;
  role: UserRole | null;
  userName: string;
  hostToken: string | null;
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

let listenersConfigured = false;

function setupSocketListeners(set: any, get: any) {
  if (listenersConfigured) return;
  listenersConfigured = true;

  socket.on('connect', () => {
    set({ isConnected: true, error: null });

    const session = readRoomSession();
    const currentRoomId = get().roomId || session?.code;

    if (currentRoomId) {
      set({ isReconnecting: true });
      const currentName = get().userName || session?.name || 'Membro';
      const currentHostToken = get().hostToken || session?.hostToken;

      socket.emit(
        'room:join',
        {
          code: currentRoomId,
          name: currentName,
          hostToken: currentHostToken,
        },
        (res) => {
          set({ isReconnecting: false });
          if (res.success && res.state) {
            const role = res.role || 'player';
            setCurrentRole(role);
            set({
              roomId: currentRoomId,
              role,
              userName: currentName,
              members: res.state.members || [],
              isConnected: true,
              isRoomClosed: false,
              error: null,
            });

            if (role === 'player') {
              if (res.state.view) {
                applyPlayerView(res.state.view);
              }
              if (res.state.soundpad) {
                usePlayerAudioStore.getState().applyState(res.state.soundpad);
              }
              if (res.state.sharedHandouts) {
                usePlayerHandoutsStore.getState().setSharedHandouts(res.state.sharedHandouts, true);
              }
              if (res.state.projection) {
                usePlayerHandoutsStore.getState().setProjection(res.state.projection);
              }
            } else if (role === 'gm') {
              if (isLocalStateReady()) {
                get().syncStateToRoom();
                broadcastCurrentSoundpad();
              } else {
                const onReady = () => {
                  get().syncStateToRoom();
                  broadcastCurrentSoundpad();
                };
                window.addEventListener('sgm-local-ready', onReady, { once: true });
              }
            }
          } else {
            clearRoomSession();
            setCurrentRole(null);
            set({
              roomId: null,
              role: null,
              isRoomClosed: true,
              error: res.error || 'A sala expirou ou não está mais disponível.',
            });
          }
        },
      );
    }
  });

  socket.on('disconnect', () => {
    const hasRoom = Boolean(get().roomId);
    set({ isConnected: false, isReconnecting: hasRoom });
  });

  socket.on('room:closed', () => {
    clearRoomSession();
    setCurrentRole(null);
    usePlayerAudioStore.getState().reset();
    usePlayerHandoutsStore.getState().reset();
    set({
      isConnected: false,
      isReconnecting: false,
      isRoomClosed: true,
      error: 'O Mestre encerrou a mesa.',
    });
  });

  socket.on('room:members-updated', ({ members }) => {
    set({ members });
  });

  socket.on('room:member-joined', ({ member }) => {
    const currentMembers = get().members;
    if (!currentMembers.find((m: RoomMember) => m.id === member.id)) {
      set({ members: [...currentMembers, member] });
    }
  });

  socket.on('room:member-left', ({ memberId }) => {
    const members = get().members.filter((m: RoomMember) => m.id !== memberId);
    set({ members });
  });

  // Handouts & Projeção
  socket.on('handout:shared-updated', ({ handouts }) => {
    usePlayerHandoutsStore.getState().setSharedHandouts(handouts);
  });

  socket.on('projection:updated', (payload) => {
    usePlayerHandoutsStore.getState().setProjection(payload);
  });

  // Pings no mapa
  socket.on('map:pinged', (ping) => {
    set((state: MultiplayerState) => ({
      pings: [...state.pings, ping],
    }));

    setTimeout(() => {
      set((state: MultiplayerState) => ({
        pings: state.pings.filter((p) => p.id !== ping.id),
      }));
    }, 3500);
  });

  // Sincronização completa vinda do servidor (apenas para quem é jogador)
  socket.on('room:state-synced', (payload) => {
    if (isPlayerMode()) {
      applyPlayerView(payload);
    }
  });

  socket.on('fog:updated', (payload) => {
    if (isPlayerMode()) {
      useFogStore.getState().applyState(payload);
    }
  });

  // Eventos de Tokens
  socket.on('token:moved', ({ tokenId, x, y }) => {
    useTokenStore.getState().updateTokenFromRemote(tokenId, { x, y });
    if (!isPlayerMode()) {
      triggerAutoSave();
    }
  });

  socket.on('token:updated', ({ tokenId, updates }) => {
    const mappedUpdates: Partial<Token> = {
      ...updates,
      conditions: updates.conditions
        ? updates.conditions.map((c) => ({
            name: c.name,
            desc: '',
            color: c.color,
            type: c.type,
            durationTurns: c.durationTurns,
          }))
        : undefined,
    };
    useTokenStore.getState().updateTokenFromRemote(tokenId, mappedUpdates);
    if (!isPlayerMode()) {
      triggerAutoSave();
    }
  });

  socket.on('token:added', ({ token }) => {
    const finalToken = isPlayerMode()
      ? hydratePlayerToken(token as PlayerTokenView)
      : (token as Token);
    useTokenStore.getState().addTokenFromRemote(finalToken);
  });

  socket.on('token:removed', ({ tokenId }) => {
    useTokenStore.getState().removeTokenFromRemote(tokenId);
  });

  // Iniciativa
  socket.on('initiative:updated', ({ queue, sortMode }) => {
    useTokenStore.getState().setInitiativeQueueFromRemote(queue, sortMode);
  });

  // Rodada, Turno e Cena
  socket.on('campaign:round-turn-updated', ({ round, turn, scene }) => {
    useCampaignStore.getState().setRoundTurnFromRemote(round, turn, scene);
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

  // Soundpad (apenas jogador aplica)
  socket.on('soundpad:state', (payload) => {
    if (isPlayerMode()) {
      usePlayerAudioStore.getState().applyState(payload);
    }
  });

  socket.on('soundpad:control', (payload) => {
    if (isPlayerMode()) {
      usePlayerAudioStore.getState().applyControl(payload);
    }
  });

  // Sincronizar mesa ao trocar de cena (se for GM)
  if (typeof window !== 'undefined') {
    window.addEventListener('scene-switched', () => {
      if (get().role === 'gm' && socket.connected && get().roomId) {
        get().syncStateToRoom();
      }
    });
  }
}

const initialSession = readRoomSession();

export const useMultiplayerStore = create<MultiplayerState>((set, get) => {
  setupSocketListeners(set, get);

  // Se houver uma sessão salva de uma sala anterior, reconecta automaticamente
  if (initialSession && typeof window !== 'undefined') {
    setTimeout(() => {
      if (!socket.connected) {
        socket.connect();
      }
    }, 0);
  }

  return {
    isConnected: false,
    isReconnecting: false,
    isRoomClosed: false,
    roomId: initialSession?.code ?? null,
    role: initialSession?.role ?? null,
    userName: initialSession?.name ?? '',
    hostToken: initialSession?.hostToken ?? null,
    members: [],
    pings: [],
    isModalOpen: false,
    error: null,

    setIsModalOpen: (isModalOpen) => set({ isModalOpen, error: null }),
    setError: (error) => set({ error }),

    createRoom: (hostName: string) => {
      return new Promise((resolve, reject) => {
        set({ error: null, isRoomClosed: false });

        if (!socket.connected) {
          socket.connect();
        }

        const cleanHostName = hostName.trim() || 'Mestre';

        const timeout = setTimeout(() => {
          const err =
            'Tempo limite excedido ao conectar ao servidor. Verifique se o backend está rodando.';
          set({ error: err });
          reject(new Error(err));
        }, 10000);

        socket.emit(
          'room:create',
          { hostName: cleanHostName },
          (res) => {
            clearTimeout(timeout);
            if (res.success && res.code && res.hostToken) {
              writeRoomSession({
                code: res.code,
                name: cleanHostName,
                role: 'gm',
                hostToken: res.hostToken,
              });
              setCurrentRole('gm');

              set({
                roomId: res.code,
                role: 'gm',
                userName: cleanHostName,
                hostToken: res.hostToken,
                isConnected: true,
                isRoomClosed: false,
                isReconnecting: false,
              });

              // Envia o estado completo inicial da mesa e áudio
              get().syncStateToRoom();
              broadcastCurrentSoundpad();
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
        set({ error: null, isRoomClosed: false });

        if (!socket.connected) {
          socket.connect();
        }

        const cleanCode = code.trim().toUpperCase();
        const cleanName = name.trim() || 'Jogador';
        const session = readRoomSession();
        const hostToken =
          session?.code === cleanCode ? session.hostToken : undefined;

        const timeout = setTimeout(() => {
          const err =
            'Tempo limite excedido ao conectar ao servidor. Verifique se o backend está rodando.';
          set({ error: err });
          reject(new Error(err));
        }, 10000);

        socket.emit(
          'room:join',
          { code: cleanCode, name: cleanName, hostToken },
          (res) => {
            clearTimeout(timeout);
            if (res.success && res.state) {
              const assignedRole = res.role || 'player';
              setCurrentRole(assignedRole);
              writeRoomSession({
                code: cleanCode,
                name: cleanName,
                role: assignedRole,
                hostToken: assignedRole === 'gm' ? hostToken : undefined,
              });

              set({
                roomId: cleanCode,
                role: assignedRole,
                userName: cleanName,
                hostToken: assignedRole === 'gm' ? hostToken ?? null : null,
                members: res.state.members || [],
                isConnected: true,
                isModalOpen: false,
                isRoomClosed: false,
                isReconnecting: false,
              });

              if (assignedRole === 'player') {
                if (res.state.view) {
                  applyPlayerView(res.state.view);
                }
                if (res.state.soundpad) {
                  usePlayerAudioStore.getState().applyState(res.state.soundpad);
                }
              } else if (assignedRole === 'gm') {
                if (isLocalStateReady()) {
                  get().syncStateToRoom();
                  broadcastCurrentSoundpad();
                } else {
                  const onReady = () => {
                    get().syncStateToRoom();
                    broadcastCurrentSoundpad();
                  };
                  window.addEventListener('sgm-local-ready', onReady, { once: true });
                }
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
      const wasPlayer = isPlayerMode();
      clearRoomSession();
      setCurrentRole(null);

      if (socket.connected) {
        socket.emit('room:leave');
        socket.disconnect();
      }

      usePlayerAudioStore.getState().reset();

      set({
        isConnected: false,
        isReconnecting: false,
        isRoomClosed: false,
        roomId: null,
        role: null,
        hostToken: null,
        members: [],
        pings: [],
      });

      // Se era jogador, recarrega limpo para restaurar o estado local do app
      if (wasPlayer && typeof window !== 'undefined') {
        window.location.replace(window.location.pathname);
      }
    },

    sendPing: (x: number, y: number) => {
      // Jogador não emite ping
      if (isPlayerMode()) return;
      if (!socket.connected || !get().roomId) return;
      socket.emit('map:ping', { x, y });
    },

    syncStateToRoom: () => {
      if (isPlayerMode()) return;
      if (!socket.connected || !get().roomId) return;

      const tokens = useTokenStore.getState().tokens;
      const initiativeQueue = useTokenStore.getState().initiativeQueue;
      const initiativeSortMode = useTokenStore.getState().initiativeSortMode;
      const { bgImages } = useZoneStore.getState();
      const { round, turn, scene } = useCampaignStore.getState();
      const fogStore = useFogStore.getState();
      const fog = {
        enabled: fogStore.enabled,
        defaultCovered: fogStore.defaultCovered,
        areas: fogStore.areas,
      };

      socket.emit('room:sync-state', {
        tokens,
        initiativeQueue,
        initiativeSortMode,
        bgImages,
        round,
        turn,
        scene,
        fog,
      });
    },
  };
});
