import { create } from 'zustand';
import type { PlayerHandoutView, ProjectionPayload } from '@/types/multiplayer';

export interface HandoutRevealNotification {
  id: string;
  title: string;
  type?: string;
  count: number;
  handout?: PlayerHandoutView;
}

interface PlayerHandoutsState {
  sharedHandouts: PlayerHandoutView[];
  projectedHandout: PlayerHandoutView | null;
  projectedAt: number;
  isProjectionOpen: boolean;
  isDrawerOpen: boolean;
  selectedHandout: PlayerHandoutView | null;
  unreadCount: number;
  hasInitialized: boolean;
  revealNotification: HandoutRevealNotification | null;

  setSharedHandouts: (handouts: PlayerHandoutView[], isInitial?: boolean) => void;
  setProjection: (payload: ProjectionPayload) => void;
  setIsProjectionOpen: (open: boolean) => void;
  setIsDrawerOpen: (open: boolean) => void;
  setSelectedHandout: (handout: PlayerHandoutView | null) => void;
  dismissRevealNotification: () => void;
  openRevealedHandout: (handout?: PlayerHandoutView) => void;
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
  hasInitialized: false,
  revealNotification: null,

  setSharedHandouts: (handouts, isInitial = false) => {
    const list = Array.isArray(handouts) ? handouts : [];
    const seen = new Set<string>();
    const cleanList = list.filter((h) => {
      if (!h || !h.id) return false;
      if (seen.has(h.id)) return false;
      seen.add(h.id);
      return true;
    });

    const current = Array.isArray(get().sharedHandouts) ? get().sharedHandouts : [];
    const currentIds = new Set(current.map((h) => h.id));
    const newItems = cleanList.filter((h) => !currentIds.has(h.id));

    // Se o drawer já estiver aberto ou for carga inicial, não acumula unread
    const addedUnread = isInitial || get().isDrawerOpen ? 0 : newItems.length;

    const wasInitialized = get().hasInitialized;
    let nextNotification = get().revealNotification;

    // Dispara a notificação de revelação somente se NÃO for a carga inicial e houver novos itens
    if (wasInitialized && !isInitial && newItems.length > 0) {
      const latest = newItems[newItems.length - 1];
      nextNotification = {
        id: `${latest.id}-${Date.now()}`,
        title: latest.title || 'Documento',
        type: latest.type,
        count: newItems.length,
        handout: latest,
      };
    }

    set((state) => {
      const baseUnread = isInitial ? 0 : (state.unreadCount || 0);
      const nextUnread = cleanList.length === 0 ? 0 : Math.min(cleanList.length, baseUnread + addedUnread);
      return {
        sharedHandouts: cleanList,
        hasInitialized: true,
        unreadCount: nextUnread,
        revealNotification: nextNotification,
      };
    });
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

  dismissRevealNotification: () => set({ revealNotification: null }),

  openRevealedHandout: (handout) => {
    set({
      revealNotification: null,
      unreadCount: 0,
      isDrawerOpen: true,
      selectedHandout: handout || null,
    });
  },

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
      hasInitialized: false,
      revealNotification: null,
    }),
}));
