import { create } from 'zustand';

const useKeyStore = create((set, get) => ({
  keys: [],
  activeKey: null,

  setKeys: (keys) => set({ keys }),
  setActiveKey: (key) => set({ activeKey: key }),

  addKey: (key) => {
    if (!get().keys.includes(key)) {
      set({ keys: [...get().keys, key] });
    }
  },

  deleteKey: (key) => {
    const keys = get().keys.filter(k => k !== key);
    let activeKey = get().activeKey;
    if (activeKey === key) {
      activeKey = keys[0] || null;
    }
    set({ keys, activeKey });
  },

  activateKey: (key) => set({ activeKey: key }),
}));

export default useKeyStore;
