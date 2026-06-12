import { create } from 'zustand';

const useUiStore = create((set) => ({
  currentPage: 'chat',
  settingsTab: 'appearance',
  toastMessage: null,
  toastVisible: false,
  lang: 'zh',

  setCurrentPage: (page) => set({ currentPage: page }),
  setSettingsTab: (tab) => set({ settingsTab: tab }),
  setLang: (lang) => set({ lang }),

  showToast: (msg) => {
    set({ toastMessage: msg, toastVisible: true });
    setTimeout(() => set({ toastVisible: false }), 2500);
  },
}));

export default useUiStore;
