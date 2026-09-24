import { create } from 'zustand';

export type SubPanelId =
  'diary' | 'rules' | 'scenes' | 'soundpad' | 'table' | 'roulette' | 'notes';
export type SlotId = 'left' | 'center' | 'right';

export interface MasterPanelState {
  isOpen: boolean;
  layout: {
    left: SubPanelId | null;
    center: SubPanelId | null;
    right: SubPanelId | null;
  };
  setIsOpen: (isOpen: boolean) => void;
  toggleOpen: () => void;
  setSlot: (slot: SlotId, panel: SubPanelId | null) => void;
}

export const useMasterPanelStore = create<MasterPanelState>((set) => ({
  isOpen: false,
  layout: {
    left: 'diary',
    center: 'scenes',
    right: 'rules',
  },
  setIsOpen: (isOpen) => set({ isOpen }),
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  setSlot: (slot, panel) =>
    set((state) => {
      // Basic logic to prevent duplicate panels
      const newLayout = { ...state.layout };
      if (panel) {
        if (newLayout.left === panel) newLayout.left = null;
        if (newLayout.center === panel) newLayout.center = null;
        if (newLayout.right === panel) newLayout.right = null;
      }
      newLayout[slot] = panel;
      return { layout: newLayout };
    }),
}));
