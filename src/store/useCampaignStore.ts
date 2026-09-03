import { create } from 'zustand';

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

  setScene: (scene) => set({ scene }),
  nextScene: () =>
    set((state) => ({ scene: state.scene + 1, round: 1, turn: 1 })),

  setRound: (round) => set({ round }),
  nextRound: () => set((state) => ({ round: state.round + 1 })),

  setTurn: (turn) => set({ turn }),
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
  },

  setUrgency: (urgency) => set({ urgency }),
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
