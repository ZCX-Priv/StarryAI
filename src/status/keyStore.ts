import { create } from 'zustand';

interface KeyState {
  keys: string[];
  activeKey: string | null;
}

interface KeyActions {
  setKeys: (keys: string[]) => void;
  setActiveKey: (key: string | null) => void;
  addKey: (key: string) => void;
  deleteKey: (key: string) => void;
  activateKey: (key: string) => void;
}

type KeyStore = KeyState & KeyActions;

const useKeyStore = create<KeyStore>((set, get) => ({
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
