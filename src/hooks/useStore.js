import { useState, useEffect } from 'react';
import useAppStore from '@/store/useAppStore';
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

        const store = useAppStore.getState();

        store.setChats(chats || []);
        store.setKeys(keys || []);
        store.setMemory(memory || []);
        if (activeKey) store.setActiveKey(activeKey);
        const effectiveTheme = theme || 'auto';
        store.setTheme(effectiveTheme);
        const dark = effectiveTheme === 'dark' || (effectiveTheme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
        if (model) store.setModel(model);
        if (activeChatId) store.setActiveChatId(activeChatId);
        store.setHoneycomb(honeycomb === true || honeycomb === 'true' || honeycomb === '1');
        if (temperature) store.setTemperature(parseFloat(temperature) || 0.7);
        if (topP) store.setTopP(parseFloat(topP) || 0.95);
        if (contextLength) store.setContextLength(parseInt(contextLength) || 10);
        if (currentAgentId) store.setCurrentAgentId(currentAgentId);
        if (currentMode) store.setCurrentMode(currentMode);

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
            store.setAgentsConfig(agentsConfig);
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
            store.setAgentsConfig(agentsConfig);
          }
        } catch (e) {
          console.error('Failed to load agents config:', e);
        }

        // Load banner config
        try {
          const bannerRes = await fetch('/data/banner.json');
          if (bannerRes.ok) {
            store.setBannerConfig(await bannerRes.json());
          }
        } catch (e) {
          console.error('Failed to load banner config:', e);
        }

        // Load models from API
        try {
          const { API } = await import('@/services/api');
          const models = await API.loadModels();
          if (models && models.length > 0) {
            store.setModels(models);
            if (!models.find(m => m.id === useAppStore.getState().model)) {
              store.setModel(models[0]?.id || 'nova-fast');
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
