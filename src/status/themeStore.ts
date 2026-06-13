import { create } from 'zustand';

interface ThemeState {
  theme: string;
  honeycomb: boolean;
  honeycombNeedsRedraw: boolean;
}

interface ThemeActions {
  setTheme: (theme: string) => void;
  setHoneycomb: (v: boolean) => void;
  triggerHoneycombRedraw: () => void;
  clearHoneycombRedraw: () => void;
}

type ThemeStore = ThemeState & ThemeActions;

const useThemeStore = create<ThemeStore>((set) => ({
  theme: 'auto',
  honeycomb: true,
  honeycombNeedsRedraw: false,

  setTheme: (theme) => set({ theme }),
  setHoneycomb: (v) => set({ honeycomb: v }),
  triggerHoneycombRedraw: () => set({ honeycombNeedsRedraw: true }),
  clearHoneycombRedraw: () => set({ honeycombNeedsRedraw: false }),
}));

export default useThemeStore;
