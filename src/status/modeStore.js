import { create } from 'zustand';

const useModeStore = create((set) => ({
  currentMode: 'fast',
  modePrompt: null,
  modeConfig: {
    fast: { reasoning_effort: "none", thinking: { type: "disabled" }, temperature: 0.8, useTools: false },
    thinking: { reasoning_effort: "high", thinking: { type: "enabled" }, temperature: 0.7, useTools: false },
    expert: { reasoning_effort: "xhigh", thinking: { type: "enabled" }, temperature: 0.6, model: "perplexity-reasoning", useTools: true },
  },
  currentBannerMode: null,
  bannerPrompt: null,
  bannerConfig: null,
  mainPromptTemplate: null,
  memoryExtractTemplate: null,
  memoryDeduplicateTemplate: null,

  setCurrentMode: (mode) => set({ currentMode: mode }),
  setModePrompt: (p) => set({ modePrompt: p }),
  setCurrentBannerMode: (mode) => set({ currentBannerMode: mode }),
  setBannerPrompt: (prompt) => set({ bannerPrompt: prompt }),
  setBannerConfig: (config) => set({ bannerConfig: config }),
  setMainPromptTemplate: (t) => set({ mainPromptTemplate: t }),
  setMemoryExtractTemplate: (t) => set({ memoryExtractTemplate: t }),
  setMemoryDeduplicateTemplate: (t) => set({ memoryDeduplicateTemplate: t }),
}));

export default useModeStore;
