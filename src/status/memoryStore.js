import { create } from 'zustand';

const useMemoryStore = create((set, get) => ({
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
