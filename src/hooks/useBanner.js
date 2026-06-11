import { useCallback } from 'react';
import useAppStore from '@/store/useAppStore';

export default function useBanner() {
  const bannerConfig = useAppStore(s => s.bannerConfig);
  const currentBannerMode = useAppStore(s => s.currentBannerMode);
  const bannerPrompt = useAppStore(s => s.bannerPrompt);

  const loadConfig = useCallback(async () => {
    try {
      const response = await fetch('/data/banner.json');
      if (!response.ok) throw new Error('Failed to load banner config');
      const config = await response.json();
      useAppStore.getState().setBannerConfig(config);
      return true;
    } catch (error) {
      console.error('Banner config load error:', error);
      return false;
    }
  }, []);

  const loadPrompt = useCallback(async (promptFile) => {
    if (!promptFile) return null;
    try {
      const response = await fetch(`/prompts/banner/${promptFile}`);
      if (!response.ok) throw new Error('Failed to load prompt');
      return await response.text();
    } catch (error) {
      console.error('Prompt load error:', error);
      return null;
    }
  }, []);

  const renderActions = useCallback(() => {
    return bannerConfig?.actions || [];
  }, [bannerConfig]);

  const handleAction = useCallback(async (action) => {
    const store = useAppStore.getState();

    if (store.currentBannerMode === action.id) {
      clearSelection();
      return;
    }

    const prompt = await loadPrompt(action.prompt);
    if (prompt) {
      store.setCurrentBannerMode(action.id);
      store.setBannerPrompt(prompt);
    }
  }, [loadPrompt]);

  const createActionButton = useCallback((action) => {
    return {
      id: action.id,
      name: action.name,
      iconSvg: action.iconSvg,
      prompt: action.prompt,
    };
  }, []);

  const clearSelection = useCallback(() => {
    useAppStore.getState().setCurrentBannerMode(null);
    useAppStore.getState().setBannerPrompt(null);
  }, []);

  return {
    bannerConfig,
    currentBannerMode,
    bannerPrompt,
    loadConfig,
    renderActions,
    handleAction,
    createActionButton,
    clearSelection,
  };
}
