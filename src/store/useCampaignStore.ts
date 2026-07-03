import { create } from 'zustand';

interface CampaignState {
  scene: number;
  round: number;
  turn: number;
  urgency: number | null;
  turnsPerRound: number;
  
  setScene: (scene: number) => void;
  nextScene: () => void;
  setRound: (round: number) => void;
  nextRound: () => void;
  setTurn: (turn: number) => void;
  addTurn: () => void;
  setUrgency: (urgency: number | null) => void;
  changeUrgency: (amount: number) => void;
  setTurnsPerRound: (amount: number) => void;
}

export const useCampaignStore = create<CampaignState>((set, get) => ({
  scene: 1,
  round: 1,
  turn: 1,
  urgency: null,
  turnsPerRound: 10,
  
  setScene: (scene) => set({ scene }),
  nextScene: () => set((state) => ({ scene: state.scene + 1, round: 1, turn: 1 })),
  
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
  changeUrgency: (amount) => set((state) => {
    if (state.urgency === null) return { urgency: Math.max(0, amount) };
    return { urgency: Math.max(0, state.urgency + amount) };
  }),
  
  setTurnsPerRound: (turnsPerRound) => set({ turnsPerRound }),
}));
