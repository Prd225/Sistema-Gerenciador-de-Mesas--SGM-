import { create } from 'zustand';

export type TimerUrgencyMode = 'normal' | 'tension' | 'critical';

interface TimerState {
  totalSeconds: number;
  isRunning: boolean;
  minimized: boolean;
  urgencyMode: TimerUrgencyMode;

  setTotalSeconds: (seconds: number) => void;
  addSeconds: (seconds: number) => void;
  setUrgencyMode: (mode: TimerUrgencyMode) => void;
  decrement: () => void;
  setIsRunning: (isRunning: boolean) => void;
  setMinimized: (minimized: boolean) => void;
  toggleMinimize: () => void;
  toggleIsRunning: () => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  stop: () => void;
}

export const useTimerStore = create<TimerState>((set) => ({
  totalSeconds: 0,
  isRunning: false,
  minimized: false,
  urgencyMode: 'normal',

  setTotalSeconds: (totalSeconds) =>
    set({ totalSeconds: Math.max(0, totalSeconds) }),
  addSeconds: (seconds) =>
    set((state) => ({
      totalSeconds: Math.max(0, state.totalSeconds + seconds),
    })),
  setUrgencyMode: (urgencyMode) => set({ urgencyMode }),
  decrement: () =>
    set((state) => {
      const next = Math.max(0, state.totalSeconds - 1);
      return {
        totalSeconds: next,
        isRunning: next > 0 ? state.isRunning : false,
      };
    }),
  setIsRunning: (isRunning) => set({ isRunning }),
  setMinimized: (minimized) => set({ minimized }),
  toggleMinimize: () => set((state) => ({ minimized: !state.minimized })),
  toggleIsRunning: () => set((state) => ({ isRunning: !state.isRunning })),
  start: () => set({ isRunning: true }),
  pause: () => set({ isRunning: false }),
  reset: () => set({ totalSeconds: 0, isRunning: false }),
  stop: () => set({ isRunning: false }),
}));
