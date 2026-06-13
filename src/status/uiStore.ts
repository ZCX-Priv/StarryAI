import { create } from 'zustand';
import { toast } from 'sonner';
import type { PageType, SettingsTab } from '@/types';

interface UiState {
  currentPage: PageType;
  settingsTab: SettingsTab;
  lang: string;
}

interface UiActions {
  setCurrentPage: (page: PageType) => void;
  setSettingsTab: (tab: SettingsTab) => void;
  setLang: (lang: string) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

type UiStore = UiState & UiActions;

const useUiStore = create<UiStore>((set) => ({
  currentPage: 'chat',
  settingsTab: 'appearance',
  lang: 'zh',

  setCurrentPage: (page) => set({ currentPage: page }),
  setSettingsTab: (tab) => set({ settingsTab: tab }),
  setLang: (lang) => set({ lang }),

  showToast: (msg, type = 'success') => {
    const fn = type === 'error' ? toast.error
      : type === 'info' ? toast.info
      : type === 'warning' ? toast.warning
      : toast.success;
    fn(msg);
  },
}));

export default useUiStore;
