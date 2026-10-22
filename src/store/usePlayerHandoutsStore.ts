import { create } from 'zustand';
import type { PlayerHandoutView, ProjectionPayload } from '@/types/multiplayer';

interface PlayerHandoutsState {
  sharedHandouts: PlayerHandoutView[];
  projectedHandout: PlayerHandoutView | null;
  projectedAt: number;
  isProjectionOpen: boolean;
  isDrawerOpen: boolean;
  selectedHandout: PlayerHandoutView | null;
  unreadCount: number;

  setSharedHandouts: (handouts: PlayerHandoutView[]) => void;
  setProjection: (payload: ProjectionPayload) => void;
  setIsProjectionOpen: (open: boolean) => void;
  setIsDrawerOpen: (open: boolean) => void;
  setSelectedHandout: (handout: PlayerHandoutView | null) => void;
  markAllRead: () => void;
  reset: () => void;
}

export const usePlayerHandoutsStore = create<PlayerHandoutsState>((set, get) => ({
  sharedHandouts: [],
  projectedHandout: null,
  projectedAt: 0,
  isProjectionOpen: false,
  isDrawerOpen: false,
  selectedHandout: null,
  unreadCount: 0,

  setSharedHandouts: (handouts) => {
    const current = get().sharedHandouts;
    const currentIds = new Set(current.map((h) => h.id));
    const newItems = handouts.filter((h) => !currentIds.has(h.id));

    // Se o drawer já estiver aberto, não acumula unread
    const addedUnread = get().isDrawerOpen ? 0 : newItems.length;

    set((state) => ({
      sharedHandouts: handouts,
      unreadCount: state.unreadCount + addedUnread,
    }));
  },

  setProjection: (payload) => {
    if (payload.handout) {
      set({
        projectedHandout: payload.handout,
        projectedAt: payload.projectedAt,
        isProjectionOpen: true,
      });
    } else {
      set({
        projectedHandout: null,
        projectedAt: 0,
        isProjectionOpen: false,
      });
    }
  },

  setIsProjectionOpen: (open) => set({ isProjectionOpen: open }),

  setIsDrawerOpen: (open) => {
    set({ isDrawerOpen: open });
    if (open) {
      set({ unreadCount: 0 });
    }
  },

  setSelectedHandout: (handout) => set({ selectedHandout: handout }),

  markAllRead: () => set({ unreadCount: 0 }),

  reset: () =>
    set({
      sharedHandouts: [],
      projectedHandout: null,
      projectedAt: 0,
      isProjectionOpen: false,
      isDrawerOpen: false,
      selectedHandout: null,
      unreadCount: 0,
    }),
}));
