import { create } from 'zustand';

interface TimerState {
  totalSeconds: number;
  isRunning: boolean;
  minimized: boolean;

  setTotalSeconds: (seconds: number) => void;
  decrement: () => void;
  setIsRunning: (isRunning: boolean) => void;
  setMinimized: (minimized: boolean) => void;
  toggleMinimize: () => void;
  toggleIsRunning: () => void;
  stop: () => void;
}

export const useTimerStore = create<TimerState>((set) => ({
  totalSeconds: 0,
  isRunning: false,
  minimized: false,

  setTotalSeconds: (totalSeconds) => set({ totalSeconds }),
  decrement: () =>
    set((state) => ({
      totalSeconds: Math.max(0, state.totalSeconds - 1),
      isRunning: state.totalSeconds - 1 > 0 ? state.isRunning : false,
    })),
  setIsRunning: (isRunning) => set({ isRunning }),
  setMinimized: (minimized) => set({ minimized }),
  toggleMinimize: () => set((state) => ({ minimized: !state.minimized })),
  toggleIsRunning: () => set((state) => ({ isRunning: !state.isRunning })),
  stop: () => set({ isRunning: false }),
}));
