import { create } from 'zustand';

interface LoadingState {
  isLoading: boolean;
  title: string;
  subtitle: string;
  progress: number | null; // 0..100, ou null para barra indeterminada contínua
  show: (title?: string, subtitle?: string, progress?: number | null) => void;
  setProgress: (progress: number | null) => void;
  setSubtitle: (subtitle: string) => void;
  hide: () => void;
}

export const useLoadingStore = create<LoadingState>((set) => ({
  isLoading: false,
  title: 'Recarregando...',
  subtitle: '',
  progress: null,

  show: (
    title = 'Recarregando...',
    subtitle = '',
    progress = null,
  ) => set({ isLoading: true, title, subtitle, progress }),

  setProgress: (progress) => set({ progress }),
  setSubtitle: (subtitle) => set({ subtitle }),
  hide: () => set({ isLoading: false, progress: null }),
}));
