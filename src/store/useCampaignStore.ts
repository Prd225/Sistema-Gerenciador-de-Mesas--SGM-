import { create } from 'zustand';
import { useTokenStore } from './useTokenStore';
import { triggerAutoSave } from '@/lib/saveHelpers';

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
  
  setScene: (scene) => { set({ scene }); triggerAutoSave(); },
  nextScene: () => { set((state) => ({ scene: state.scene + 1, round: 1, turn: 1 })); triggerAutoSave(); },
  
  setRound: (round) => { set({ round }); triggerAutoSave(); },
  nextRound: () => { set((state) => ({ round: state.round + 1 })); triggerAutoSave(); },
  
  setTurn: (turn) => { set({ turn }); triggerAutoSave(); },
  addTurn: () => {
    const { turn, turnsPerRound, round, urgency } = get();
    // Pre-requisite: we need access to tokens and queue
    const tokenStore = useTokenStore.getState();
    const { initiativeQueue, tokens, updateToken } = tokenStore;

    if (initiativeQueue.length === 0) {
      // fallback to basic behavior if no queue
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
      return;
    }

    let currentTurn = turn;
    let currentRound = round;
    let currentUrgency = urgency;

    // Loop to find the next valid turn, skipping 'skip_turn' and 'out_of_combat'
    let sanityLimit = initiativeQueue.length + 1;
    while (sanityLimit > 0) {
      sanityLimit--;
      
      currentTurn++;
      if (currentTurn > turnsPerRound) {
        currentTurn = 1;
        currentRound++;
        if (currentUrgency !== null) currentUrgency = Math.max(0, currentUrgency - 1);
      }

      const queueItem = initiativeQueue[currentTurn - 1];
      if (!queueItem) break; // Should not happen if turnsPerRound matches queue length

      const token = tokens.find(t => t.id === queueItem.tokenId);
      if (!token) break;

      // Process conditions for this token as its turn is coming up
      let shouldSkip = false;
      let conditionsChanged = false;
      const newConditions = token.conditions.map(c => {
        if (c.type === 'out_of_combat') {
          shouldSkip = true;
          return c; // Out of combat usually doesn't decrement, it's persistent until removed
        }
        
        let cpy = { ...c };
        if (cpy.durationTurns !== undefined) {
          cpy.durationTurns -= 1;
          conditionsChanged = true;
        }
        
        if (cpy.type === 'skip_turn' && (cpy.durationTurns === undefined || cpy.durationTurns >= 0)) {
          shouldSkip = true;
        }

        return cpy;
      }).filter(c => c.durationTurns === undefined || c.durationTurns >= 0);

      if (conditionsChanged || newConditions.length !== token.conditions.length) {
        updateToken(token.id, { conditions: newConditions });
      }

      if (!shouldSkip) {
        // We found a valid turn
        break;
      }
    }

    set({ turn: currentTurn, round: currentRound, urgency: currentUrgency });
    triggerAutoSave();
  },
  
  setUrgency: (urgency) => { set({ urgency }); triggerAutoSave(); },
  changeUrgency: (amount) => { set((state) => ({ 
    urgency: state.urgency !== null ? Math.max(0, state.urgency + amount) : null 
  })); triggerAutoSave(); },
  setTurnsPerRound: (turnsPerRound) => { set({ turnsPerRound }); triggerAutoSave(); },
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
