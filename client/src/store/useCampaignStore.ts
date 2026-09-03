import { create } from 'zustand';
import { socket } from '@/lib/socket';

interface CampaignState {
  scene: number;
  round: number;
  turn: number;
  urgency: number | null;
  turnsPerRound: number;
  showInitModal: boolean;
  showLoadModal: boolean;
  showSaveModal: boolean;
  autoSaveSlot: number | null;
  autoSaveStatus: 'idle' | 'saving' | 'success';

  setScene: (scene: number) => void;
  nextScene: () => void;
  setRound: (round: number) => void;
  nextRound: () => void;
  setTurn: (turn: number) => void;
  addTurn: () => void;
  setRoundTurnFromRemote: (round: number, turn: number) => void;

  setUrgency: (urgency: number | null) => void;
  changeUrgency: (amount: number) => void;
  setTurnsPerRound: (amount: number) => void;
  setShowInitModal: (show: boolean) => void;
  setShowLoadModal: (show: boolean) => void;
  setShowSaveModal: (show: boolean) => void;
  setAutoSaveSlot: (slot: number | null) => void;
  setAutoSaveStatus: (status: 'idle' | 'saving' | 'success') => void;
}

export const useCampaignStore = create<CampaignState>((set, get) => ({
  scene: 1,
  round: 1,
  turn: 1,
  urgency: null,
  turnsPerRound: 10,
  showInitModal: false,
  showLoadModal: false,
  showSaveModal: false,
  autoSaveSlot: localStorage.getItem('sgm_autoSaveSlot')
    ? parseInt(localStorage.getItem('sgm_autoSaveSlot') as string, 10)
    : null,
  autoSaveStatus: 'idle',

  setScene: (scene) => set({ scene: Math.max(1, scene) }),
  nextScene: () => {
    set((state) => ({
      scene: state.scene + 1,
      round: 1,
      turn: 1,
      urgency: null,
    }));
    if (socket.connected) {
      socket.emit('campaign:update-round-turn', { round: 1, turn: 1 });
    }
  },

  setRound: (round) => {
    const validRound = Math.max(1, round);
    set({ round: validRound });
    if (socket.connected) {
      socket.emit('campaign:update-round-turn', {
        round: validRound,
        turn: get().turn,
      });
    }
  },
  nextRound: () => {
    const { round, urgency } = get();
    const nextRound = round + 1;
    const nextUrgency = urgency !== null ? Math.max(0, urgency - 1) : null;
    set({ round: nextRound, turn: 1, urgency: nextUrgency });
    if (socket.connected) {
      socket.emit('campaign:update-round-turn', {
        round: nextRound,
        turn: 1,
      });
    }
  },

  setTurn: (turn) => {
    const validTurn = Math.max(1, turn);
    set({ turn: validTurn });
    if (socket.connected) {
      socket.emit('campaign:update-round-turn', {
        round: get().round,
        turn: validTurn,
      });
    }
  },
  addTurn: () => {
    const { turn, turnsPerRound, round, urgency } = get();
    let nextTurn = turn + 1;
    let nextRound = round;
    let nextUrgency = urgency;

    if (nextTurn > turnsPerRound) {
      nextTurn = 1;
      nextRound += 1;
      if (urgency !== null) {
        nextUrgency = Math.max(0, urgency - 1);
      }
    }

    set({ turn: nextTurn, round: nextRound, urgency: nextUrgency });
    if (socket.connected) {
      socket.emit('campaign:update-round-turn', {
        round: nextRound,
        turn: nextTurn,
      });
    }
  },

  setRoundTurnFromRemote: (round, turn) => set({ round, turn }),

  setUrgency: (urgency) =>
    set({ urgency: urgency !== null ? Math.max(0, urgency) : null }),
  changeUrgency: (amount) =>
    set((state) => ({
      urgency:
        state.urgency !== null ? Math.max(0, state.urgency + amount) : null,
    })),
  setTurnsPerRound: (turnsPerRound) => set({ turnsPerRound }),
  setShowInitModal: (showInitModal) => set({ showInitModal }),
  setShowLoadModal: (showLoadModal) => set({ showLoadModal }),
  setShowSaveModal: (showSaveModal) => set({ showSaveModal }),
  setAutoSaveSlot: (autoSaveSlot) => {
    if (autoSaveSlot === null) {
      localStorage.removeItem('sgm_autoSaveSlot');
    } else {
      localStorage.setItem('sgm_autoSaveSlot', autoSaveSlot.toString());
    }
    set({ autoSaveSlot });
  },
  setAutoSaveStatus: (autoSaveStatus) => set({ autoSaveStatus }),
}));
