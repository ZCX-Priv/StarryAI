import { create } from 'zustand';

interface MemoryState {
  memory: string[];
}

interface MemoryActions {
  setMemory: (memory: string[]) => void;
  addMemoryItems: (items: string[]) => void;
  setMemoryItems: (items: string[]) => void;
  editMemoryItem: (index: number, value: string) => void;
  deleteMemoryItem: (index: number) => void;
  clearMemory: () => void;
}

type MemoryStore = MemoryState & MemoryActions;

const useMemoryStore = create<MemoryStore>((set, get) => ({
  memory: [],

  setMemory: (memory) => set({ memory }),

  addMemoryItems: (items) => {
    set({ memory: [...get().memory, ...items] });
  },

  setMemoryItems: (items) => {
    set({ memory: items });
  },

  editMemoryItem: (index, value) => {
    const memory = [...get().memory];
    memory[index] = value;
    set({ memory });
  },

  deleteMemoryItem: (index) => {
    const memory = get().memory.filter((_, i) => i !== index);
    set({ memory });
  },

  clearMemory: () => set({ memory: [] }),
}));

export default useMemoryStore;
