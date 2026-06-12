import { create } from 'zustand';
import { DEFAULT_MODELS } from '@/lib/config';

const useModelStore = create((set) => ({
  model: 'nova-fast',
  models: DEFAULT_MODELS,
  temperature: 0.7,
  topP: 0.95,
  contextLength: 10,

  setModel: (model) => set({ model }),
  setModels: (models) => set({ models }),
  setTemperature: (v) => set({ temperature: v }),
  setTopP: (v) => set({ topP: v }),
  setContextLength: (v) => set({ contextLength: v }),
}));

export default useModelStore;
