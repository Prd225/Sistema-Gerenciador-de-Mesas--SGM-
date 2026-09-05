import { create } from 'zustand';
import { useTokenStore } from './useTokenStore';
import { triggerAutoSave } from '@/lib/saveHelpers';
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

  setScene: (scene) => {
    set({ scene });
    triggerAutoSave();
  },
  nextScene: () => {
    set((state) => ({ scene: state.scene + 1, round: 1, turn: 1 }));
    triggerAutoSave();
    if (socket.connected) {
      socket.emit('campaign:update-round-turn', { round: 1, turn: 1 });
    }
  },

  setRound: (round) => {
    set({ round });
    triggerAutoSave();
    if (socket.connected) {
      socket.emit('campaign:update-round-turn', { round, turn: get().turn });
    }
  },
  nextRound: () => {
    const nextR = get().round + 1;
    set({ round: nextR });
    triggerAutoSave();
    if (socket.connected) {
      socket.emit('campaign:update-round-turn', {
        round: nextR,
        turn: get().turn,
      });
    }
  },

  setTurn: (turn) => {
    set({ turn });
    triggerAutoSave();
    if (socket.connected) {
      socket.emit('campaign:update-round-turn', { round: get().round, turn });
    }
  },

  addTurn: () => {
    const { turn, turnsPerRound, round, urgency } = get();
    const tokenStore = useTokenStore.getState();
    const { initiativeQueue, tokens, updateToken } = tokenStore;

    if (initiativeQueue.length === 0) {
      let nextTurn = turn + 1;
      let nextRound = round;
      let nextUrgency = urgency;
      if (nextTurn > turnsPerRound) {
        nextTurn = 1;
        nextRound += 1;
        if (urgency !== null) nextUrgency = Math.max(0, urgency - 1);
      }
      set({ turn: nextTurn, round: nextRound, urgency: nextUrgency });
      triggerAutoSave();
      if (socket.connected) {
        socket.emit('campaign:update-round-turn', {
          round: nextRound,
          turn: nextTurn,
        });
      }
      return;
    }

    let currentTurn = turn;
    let currentRound = round;
    let currentUrgency = urgency;

    let sanityLimit = initiativeQueue.length + 1;
    while (sanityLimit > 0) {
      sanityLimit--;

      currentTurn++;
      if (currentTurn > turnsPerRound) {
        currentTurn = 1;
        currentRound++;
        if (currentUrgency !== null)
          currentUrgency = Math.max(0, currentUrgency - 1);
      }

      const queueItem = initiativeQueue[currentTurn - 1];
      if (!queueItem) break;

      const token = tokens.find((t) => t.id === queueItem.tokenId);
      if (!token) break;

      let shouldSkip = false;
      let conditionsChanged = false;
      const newConditions = token.conditions
        .map((c) => {
          if (c.type === 'out_of_combat') {
            shouldSkip = true;
            return c;
          }

          let cpy = { ...c };
          if (cpy.durationTurns !== undefined) {
            cpy.durationTurns -= 1;
            conditionsChanged = true;
          }

          if (
            cpy.type === 'skip_turn' &&
            (cpy.durationTurns === undefined || cpy.durationTurns >= 0)
          ) {
            shouldSkip = true;
          }

          return cpy;
        })
        .filter((c) => c.durationTurns === undefined || c.durationTurns >= 0);

      if (
        conditionsChanged ||
        newConditions.length !== token.conditions.length
      ) {
        updateToken(token.id, { conditions: newConditions });
      }

      if (!shouldSkip) {
        break;
      }
    }

    set({ turn: currentTurn, round: currentRound, urgency: currentUrgency });
    triggerAutoSave();
    if (socket.connected) {
      socket.emit('campaign:update-round-turn', {
        round: currentRound,
        turn: currentTurn,
      });
    }
  },

  setRoundTurnFromRemote: (round, turn) => set({ round, turn }),

  setUrgency: (urgency) => {
    set({ urgency });
    triggerAutoSave();
  },
  changeUrgency: (amount) => {
    set((state) => ({
      urgency:
        state.urgency !== null ? Math.max(0, state.urgency + amount) : null,
    }));
    triggerAutoSave();
  },
  setTurnsPerRound: (turnsPerRound) => {
    set({ turnsPerRound });
    triggerAutoSave();
  },
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
