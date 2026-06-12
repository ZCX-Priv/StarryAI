import { create } from 'zustand';

const useThemeStore = create((set) => ({
  theme: 'auto',
  honeycomb: true,
  honeycombNeedsRedraw: false,

  setTheme: (theme) => set({ theme }),
  setHoneycomb: (v) => set({ honeycomb: v }),
  triggerHoneycombRedraw: () => set({ honeycombNeedsRedraw: true }),
  clearHoneycombRedraw: () => set({ honeycombNeedsRedraw: false }),
}));

export default useThemeStore;
