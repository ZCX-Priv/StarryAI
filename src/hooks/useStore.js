import { useState, useEffect } from 'react';
import { useChatStore, useKeyStore, useMemoryStore, useModelStore, useThemeStore, useAgentStore, useModeStore, useUiStore, useStreamStore } from '@/status';
import { IDBStore } from '@/services/storage';
import { Migration } from '@/services/migration';
import { loadMainPrompt, loadMemoryPrompts, loadModePrompt } from '@/lib/prompts';

export default function useStore() {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        await IDBStore.init();
        await Migration.run();
      } catch (err) {
        console.error('IndexedDB 初始化失败:', err);
      }

      try {
        const [
          chats, keys, memory, activeKey,
          theme, model, activeChatId, honeycomb,
          temperature, topP, contextLength,
          currentAgentId, currentMode,
        ] = await Promise.all([
          IDBStore.getAllChats(),
          IDBStore.getKeys(),
          IDBStore.getMemory(),
          IDBStore.getActiveKey(),
          IDBStore.getConfig('theme'),
          IDBStore.getConfig('model'),
          IDBStore.getConfig('activeChatId'),
          IDBStore.getConfig('honeycomb'),
          IDBStore.getConfig('temperature'),
          IDBStore.getConfig('topP'),
          IDBStore.getConfig('contextLength'),
          IDBStore.getAgentConfig('currentAgentId'),
          IDBStore.getConfig('currentMode'),
        ]);

        if (cancelled) return;

        useChatStore.getState().setChats(chats || []);
        useKeyStore.getState().setKeys(keys || []);
        useMemoryStore.getState().setMemory(memory || []);
        if (activeKey) useKeyStore.getState().setActiveKey(activeKey);
        const effectiveTheme = theme || 'auto';
        useThemeStore.getState().setTheme(effectiveTheme);
        const dark = effectiveTheme === 'dark' || (effectiveTheme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
        if (model) useModelStore.getState().setModel(model);
        if (activeChatId) useChatStore.getState().setActiveChatId(activeChatId);
        useThemeStore.getState().setHoneycomb(honeycomb === true || honeycomb === 'true' || honeycomb === '1');
        if (temperature) useModelStore.getState().setTemperature(parseFloat(temperature) || 0.7);
        if (topP) useModelStore.getState().setTopP(parseFloat(topP) || 0.95);
        if (contextLength) useModelStore.getState().setContextLength(parseInt(contextLength) || 10);
        if (currentAgentId) useAgentStore.getState().setCurrentAgentId(currentAgentId);
        if (currentMode) useModeStore.getState().setCurrentMode(currentMode);

        // Load prompts (synchronous - they use ?raw imports)
        loadMainPrompt();
        loadMemoryPrompts();
        if (currentMode) {
          loadModePrompt(currentMode);
        }

        // Load agents config
        try {
          const agentsRes = await fetch('/data/agents.json');
          if (agentsRes.ok) {
            const agentsConfig = await agentsRes.json();
            useAgentStore.getState().setAgentsConfig(agentsConfig);
            // Load custom agents
            const customAgents = await IDBStore.getAgentConfig('customAgents') || [];
            const customCategories = await IDBStore.getAgentConfig('customCategories') || [];
            if (customAgents.length) {
              const existingIds = new Set(agentsConfig.agents.map(a => a.id));
              customAgents.forEach(agent => {
                if (!existingIds.has(agent.id)) agentsConfig.agents.push(agent);
              });
            }
            if (customCategories.length) {
              const existingCatIds = new Set(agentsConfig.categories.map(c => c.id));
              customCategories.forEach(cat => {
                if (!existingCatIds.has(cat.id)) {
                  const insertIdx = agentsConfig.categories.findIndex(c => c.id === 'mine');
                  if (insertIdx > 0) agentsConfig.categories.splice(insertIdx, 0, cat);
                  else agentsConfig.categories.push(cat);
                }
              });
            }
            useAgentStore.getState().setAgentsConfig(agentsConfig);
          }
        } catch (e) {
          console.error('Failed to load agents config:', e);
        }

        // Load banner config
        try {
          const bannerRes = await fetch('/data/banner.json');
          if (bannerRes.ok) {
            useModeStore.getState().setBannerConfig(await bannerRes.json());
          }
        } catch (e) {
          console.error('Failed to load banner config:', e);
        }

        // Load models from API
        try {
          const { API } = await import('@/services/api');
          const models = await API.loadModels();
          if (models && models.length > 0) {
            useModelStore.getState().setModels(models);
            if (!models.find(m => m.id === useModelStore.getState().model)) {
              useModelStore.getState().setModel(models[0]?.id || 'nova-fast');
            }
          }
        } catch {}

        if (!cancelled) setInitialized(true);
      } catch (err) {
        console.error('Store 初始化失败:', err);
        if (!cancelled) setError(err.message);
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  return { initialized, error };
}
