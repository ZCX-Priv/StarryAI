import { create } from 'zustand';
import { toast } from 'sonner';

const useUiStore = create((set) => ({
  currentPage: 'chat',
  settingsTab: 'appearance',
  lang: 'zh',

  setCurrentPage: (page) => set({ currentPage: page }),
  setSettingsTab: (tab) => set({ settingsTab: tab }),
  setLang: (lang) => set({ lang }),

  showToast: (msg, type = 'success') => {
    const fn = toast[type] || toast;
    fn(msg);
  },
}));

export default useUiStore;
