import { create } from 'zustand';
import { DEFAULT_MODELS } from '@/lib/config';
import type { ModelInfo } from '@/types';

interface ModelState {
  model: string;
  models: ModelInfo[];
  temperature: number;
  topP: number;
  contextLength: number;
}

interface ModelActions {
  setModel: (model: string) => void;
  setModels: (models: ModelInfo[]) => void;
  setTemperature: (v: number) => void;
  setTopP: (v: number) => void;
  setContextLength: (v: number) => void;
}

type ModelStore = ModelState & ModelActions;

const useModelStore = create<ModelStore>((set) => ({
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
