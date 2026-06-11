import { useCallback } from 'react';
import useAppStore from '@/store/useAppStore';
import { IDBStore } from '@/services/storage';

export default function useAgents() {
  const agentsConfig = useAppStore(s => s.agentsConfig);
  const currentAgentId = useAppStore(s => s.currentAgentId);
  const agentPrompt = useAppStore(s => s.agentPrompt);

  const loadConfig = useCallback(async () => {
    try {
      const response = await fetch('/data/agents.json');
      if (!response.ok) throw new Error('Failed to load agents config');
      const config = await response.json();

      // Load custom categories
      const customCategories = await IDBStore.getAgentConfig('customCategories') || [];
      if (config.categories) {
        const existingIds = new Set(config.categories.map(c => c.id));
        customCategories.forEach(cat => {
          if (!existingIds.has(cat.id)) {
            const insertIdx = config.categories.findIndex(c => c.id === 'mine');
            if (insertIdx > 0) config.categories.splice(insertIdx, 0, cat);
            else config.categories.push(cat);
          }
        });
      }

      // Load custom agents
      const customAgents = await IDBStore.getAgentConfig('customAgents') || [];
      if (config.agents) {
        const existingIds = new Set(config.agents.map(a => a.id));
        customAgents.forEach(agent => {
          if (!existingIds.has(agent.id)) config.agents.push(agent);
        });
      }

      useAppStore.getState().setAgentsConfig(config);
      return true;
    } catch (error) {
      console.error('Agents config load error:', error);
      return false;
    }
  }, []);

  const loadPrompt = useCallback(async (promptFile) => {
    if (!promptFile) return null;
    try {
      const response = await fetch(`/prompts/agents/${promptFile}`);
      if (!response.ok) throw new Error('Failed to load agent prompt');
      return await response.text();
    } catch (error) {
      console.error('Agent prompt load error:', error);
      return null;
    }
  }, []);

  const select = useCallback(async (agentId) => {
    const config = useAppStore.getState().agentsConfig;
    const agent = config?.agents.find(a => a.id === agentId);
    if (!agent) return;

    useAppStore.getState().setCurrentAgentId(agentId);
    await IDBStore.setAgentConfig('currentAgentId', agentId);

    let prompt;
    if (agent.isCustom) {
      prompt = agent.prompt;
    } else {
      prompt = await loadPrompt(agent.prompt);
    }
    useAppStore.getState().setAgentPrompt(prompt);

    // Add to recent
    let recent = await IDBStore.getAgentConfig('recentAgents') || [];
    recent = recent.filter(id => id !== agentId);
    recent.unshift(agentId);
    recent = recent.slice(0, 10);
    await IDBStore.setAgentConfig('recentAgents', recent);
  }, [loadPrompt]);

  const renderPlaza = useCallback(() => {
    return agentsConfig?.agents || [];
  }, [agentsConfig]);

  const filterByCategory = useCallback((categoryId) => {
    const config = useAppStore.getState().agentsConfig;
    if (!config?.agents) return [];

    if (categoryId === 'all') return config.agents;
    if (categoryId === 'mine') {
      // Return recent agents (would need async, return all for sync use)
      return config.agents;
    }
    return config.agents.filter(a => a.category === categoryId);
  }, []);

  const searchAgents = useCallback((keyword) => {
    const config = useAppStore.getState().agentsConfig;
    if (!config?.agents || !keyword) return config?.agents || [];
    const lowerKeyword = keyword.toLowerCase();
    return config.agents.filter(agent =>
      agent.name.toLowerCase().includes(lowerKeyword) ||
      agent.description.toLowerCase().includes(lowerKeyword)
    );
  }, []);

  const createAgent = useCallback(async ({ name, emoji, description, prompt, category }) => {
    if (!name || name.length < 1 || name.length > 20) return false;
    if (!prompt || prompt.length < 10 || prompt.length > 2000) return false;

    const agent = {
      id: 'custom_' + Date.now(),
      name,
      emoji: emoji || '🤖',
      avatar: null,
      prompt,
      description: description || '自定义智能体',
      category: category || 'work',
      isCustom: true,
    };

    try {
      let customAgents = await IDBStore.getAgentConfig('customAgents') || [];
      customAgents.push(agent);
      await IDBStore.setAgentConfig('customAgents', customAgents);

      const config = useAppStore.getState().agentsConfig;
      if (config?.agents) {
        config.agents.push(agent);
        useAppStore.getState().setAgentsConfig({ ...config });
      }
      return true;
    } catch (error) {
      console.error('创建智能体失败:', error);
      return false;
    }
  }, []);

  const deleteCustomAgent = useCallback(async (agentId) => {
    try {
      let customAgents = await IDBStore.getAgentConfig('customAgents') || [];
      customAgents = customAgents.filter(a => a.id !== agentId);
      await IDBStore.setAgentConfig('customAgents', customAgents);

      const config = useAppStore.getState().agentsConfig;
      if (config?.agents) {
        config.agents = config.agents.filter(a => a.id !== agentId);
        useAppStore.getState().setAgentsConfig({ ...config });
      }
      return true;
    } catch (error) {
      console.error('删除智能体失败:', error);
      return false;
    }
  }, []);

  const createCategory = useCallback(async (name) => {
    if (!name || name.length < 1 || name.length > 10) return false;

    const config = useAppStore.getState().agentsConfig;
    const existingNames = config?.categories?.map(c => c.name) || [];
    if (existingNames.includes(name)) return false;

    const category = {
      id: 'custom_category_' + Date.now(),
      name,
      isCustom: true,
    };

    try {
      let customCategories = await IDBStore.getAgentConfig('customCategories') || [];
      customCategories.push(category);
      await IDBStore.setAgentConfig('customCategories', customCategories);

      if (config?.categories) {
        const insertIdx = config.categories.findIndex(c => c.id === 'mine');
        if (insertIdx > 0) config.categories.splice(insertIdx, 0, category);
        else config.categories.push(category);
        useAppStore.getState().setAgentsConfig({ ...config });
      }
      return true;
    } catch (error) {
      console.error('创建分类失败:', error);
      return false;
    }
  }, []);

  const deleteCategory = useCallback(async (categoryId) => {
    try {
      let customCategories = await IDBStore.getAgentConfig('customCategories') || [];
      customCategories = customCategories.filter(c => c.id !== categoryId);
      await IDBStore.setAgentConfig('customCategories', customCategories);

      const config = useAppStore.getState().agentsConfig;
      if (config?.categories) {
        config.categories = config.categories.filter(c => c.id !== categoryId);
        useAppStore.getState().setAgentsConfig({ ...config });
      }
      return true;
    } catch (error) {
      console.error('删除分类失败:', error);
      return false;
    }
  }, []);

  return {
    agentsConfig,
    currentAgentId,
    agentPrompt,
    loadConfig,
    select,
    loadPrompt,
    renderPlaza,
    filterByCategory,
    searchAgents,
    createAgent,
    deleteCustomAgent,
    createCategory,
    deleteCategory,
  };
}
