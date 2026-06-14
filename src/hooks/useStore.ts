import { useState, useEffect } from 'react';
import { useChatStore, useKeyStore, useMemoryStore, useModelStore, useThemeStore, useAgentStore, useModeStore, useUiStore, useStreamStore } from '@/status';
import { IDBStore } from '@/services/storage';
import { Migration } from '@/services/migration';
import { loadMainPrompt, loadMemoryPrompts, loadModePrompt } from '@/lib/prompts';
import type { Chat, ModeType, MessageStatus } from '@/types';

export default function useStore(): { initialized: boolean; error: string | null; loadProgress: number } {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadProgress, setLoadProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      // 等待 logo 图片下载完成，确保 loading 页面完整显示
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = '/logo.png';
        if (img.complete) resolve();
      });

      // 再等一帧确保 DOM 渲染
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });

      // 模拟进度：先快后慢，到 99% 停住
      let simulated = 0;
      const progressTimer = setInterval(() => {
        if (simulated < 60) simulated += 8;
        else if (simulated < 85) simulated += 5;
        else if (simulated < 99) simulated += 2;
        else return;
        if (!cancelled) setLoadProgress(simulated);
      }, 300);

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

        // 为旧 Message 补充 UUID，并将刷新前未完成的 streaming 消息降级为 interrupted
        const migratedChats = (chats || []).map((chat: Chat) => {
          let modified = false;
          const messages = chat.messages.map(msg => {
            if (msg.status === 'streaming') {
              modified = true;
              return { ...msg, status: 'interrupted' as MessageStatus };
            }
            return msg;
          });
          if (modified) {
            IDBStore.saveChat({ ...chat, messages }).catch(() => {});
          }
          return {
            ...chat,
            messages: messages.map(msg =>
              msg.id ? msg : { ...msg, id: crypto.randomUUID() }
            ),
          };
        });
        useChatStore.getState().setChats(migratedChats);
        useKeyStore.getState().setKeys(keys || []);
        useMemoryStore.getState().setMemory(memory || []);
        if (activeKey) useKeyStore.getState().setActiveKey(activeKey);
        const effectiveTheme = theme || 'auto';
        useThemeStore.getState().setTheme(effectiveTheme);
        const dark = effectiveTheme === 'dark' || (effectiveTheme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
        if (model) useModelStore.getState().setModel(model);
        if (activeChatId) useChatStore.getState().setActiveChatId(activeChatId);
        if (honeycomb != null) {
          useThemeStore.getState().setHoneycomb(String(honeycomb) === 'true' || honeycomb === '1');
        }
        if (temperature) useModelStore.getState().setTemperature(parseFloat(String(temperature)) || 0.7);
        if (topP) useModelStore.getState().setTopP(parseFloat(String(topP)) || 0.95);
        if (contextLength) useModelStore.getState().setContextLength(parseInt(String(contextLength)) || 10);
        if (currentAgentId) useAgentStore.getState().setCurrentAgentId(String(currentAgentId));
        if (currentMode) useModeStore.getState().setCurrentMode(currentMode as ModeType);

        // Load prompts (synchronous - they use ?raw imports)
        loadMainPrompt();
        loadMemoryPrompts();
        if (currentMode) {
          loadModePrompt(currentMode as ModeType);
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
            if (Array.isArray(customAgents) && customAgents.length) {
              const existingIds = new Set(agentsConfig.agents.map((a: { id: string }) => a.id));
              customAgents.forEach((agent: { id: string }) => {
                if (!existingIds.has(agent.id)) agentsConfig.agents.push(agent);
              });
            }
            if (Array.isArray(customCategories) && customCategories.length) {
              const existingCatIds = new Set(agentsConfig.categories.map((c: { id: string }) => c.id));
              customCategories.forEach((cat: { id: string }) => {
                if (!existingCatIds.has(cat.id)) {
                  const insertIdx = agentsConfig.categories.findIndex((c: { id: string }) => c.id === 'mine');
                  if (insertIdx > 0) agentsConfig.categories.splice(insertIdx, 0, cat);
                  else agentsConfig.categories.push(cat);
                }
              });
            }
            useAgentStore.getState().setAgentsConfig(agentsConfig);

            // 确保 currentAgentId 有默认值并加载对应 prompt
            const agentId = useAgentStore.getState().currentAgentId || 'assistant';
            useAgentStore.getState().setCurrentAgentId(agentId);
            await IDBStore.setAgentConfig('currentAgentId', agentId);
            const currentAgent = agentsConfig.agents.find((a: { id: string }) => a.id === agentId);
            if (currentAgent) {
              try {
                const promptRes = await fetch(`/prompts/agents/${currentAgent.prompt || currentAgent.promptFile}`);
                if (promptRes.ok) {
                  useAgentStore.getState().setAgentPrompt(await promptRes.text());
                }
              } catch { /* ignored */ }
            }
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
        } catch { /* ignored */ }

        // 初始化完成！飞速递增到 100%
        clearInterval(progressTimer);
        await new Promise<void>((resolve) => {
          const finishTimer = setInterval(() => {
            simulated += 3;
            if (simulated >= 100) {
              simulated = 100;
              clearInterval(finishTimer);
              if (!cancelled) setLoadProgress(100);
              resolve();
            } else {
              if (!cancelled) setLoadProgress(Math.round(simulated));
            }
          }, 20);
        });
        if (!cancelled) setInitialized(true);
      } catch (err) {
        clearInterval(progressTimer);
        console.error('Store 初始化失败:', err);
        if (!cancelled) setError((err as Error).message);
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  return { initialized, error, loadProgress };
}
