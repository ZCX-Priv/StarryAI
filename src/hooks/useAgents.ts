import { useCallback } from 'react';
import { useAgentStore } from '@/status';
import { IDBStore } from '@/services/storage';
import type { AgentItem, AgentCategory, AgentsConfig } from '@/types';

interface CustomAgent extends Omit<AgentItem, 'avatar'> {
  isCustom: boolean;
  prompt: string;
  emoji?: string;
  avatar: string | null;
}

interface CustomCategory extends Omit<AgentCategory, 'icon'> {
  isCustom: boolean;
  icon?: string;
}

export default function useAgents() {
  const agentsConfig = useAgentStore(s => s.agentsConfig);
  const currentAgentId = useAgentStore(s => s.currentAgentId);
  const agentPrompt = useAgentStore(s => s.agentPrompt);

  const loadConfig = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/data/agents.json');
      if (!response.ok) throw new Error('Failed to load agents config');
      const config: AgentsConfig = await response.json();

      // Load custom categories
      const customCategories = (await IDBStore.getAgentConfig('customCategories')) as CustomCategory[] | null || [];
      if (config.categories) {
        const existingIds = new Set(config.categories.map(c => c.id));
        customCategories.forEach(cat => {
          if (!existingIds.has(cat.id)) {
            const insertIdx = config.categories.findIndex(c => c.id === 'mine');
            if (insertIdx > 0) config.categories.splice(insertIdx, 0, cat as unknown as AgentCategory);
            else config.categories.push(cat as unknown as AgentCategory);
          }
        });
      }

      // Load custom agents
      const customAgents = (await IDBStore.getAgentConfig('customAgents')) as CustomAgent[] | null || [];
      if (config.agents) {
        const existingIds = new Set(config.agents.map(a => a.id));
        customAgents.forEach(agent => {
          if (!existingIds.has(agent.id)) config.agents.push(agent as unknown as AgentItem);
        });
      }

      useAgentStore.getState().setAgentsConfig(config);
      return true;
    } catch (error) {
      console.error('Agents config load error:', error);
      return false;
    }
  }, []);

  const loadPrompt = useCallback(async (promptFile: string): Promise<string | null> => {
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

  const select = useCallback(async (agentId: string): Promise<void> => {
    const config = useAgentStore.getState().agentsConfig;
    const agent = config?.agents.find(a => a.id === agentId);
    if (!agent) return;

    useAgentStore.getState().setCurrentAgentId(agentId);
    await IDBStore.setAgentConfig('currentAgentId', agentId);

    let prompt: string | null;
    if ('isCustom' in agent && (agent as CustomAgent).isCustom) {
      prompt = (agent as CustomAgent).prompt;
    } else {
      prompt = await loadPrompt(agent.promptFile);
    }
    useAgentStore.getState().setAgentPrompt(prompt);

    // Add to recent
    let recent = (await IDBStore.getAgentConfig('recentAgents')) as string[] | null || [];
    recent = recent.filter(id => id !== agentId);
    recent.unshift(agentId);
    recent = recent.slice(0, 10);
    await IDBStore.setAgentConfig('recentAgents', recent);
  }, [loadPrompt]);

  const renderPlaza = useCallback((): AgentItem[] => {
    return agentsConfig?.agents || [];
  }, [agentsConfig]);

  const filterByCategory = useCallback((categoryId: string): AgentItem[] => {
    const config = useAgentStore.getState().agentsConfig;
    if (!config?.agents) return [];

    if (categoryId === 'all') return config.agents;
    if (categoryId === 'mine') {
      return config.agents;
    }
    return config.agents.filter(a => a.category === categoryId);
  }, []);

  const searchAgents = useCallback((keyword: string): AgentItem[] => {
    const config = useAgentStore.getState().agentsConfig;
    if (!config?.agents || !keyword) return config?.agents || [];
    const lowerKeyword = keyword.toLowerCase();
    return config.agents.filter(agent =>
      agent.name.toLowerCase().includes(lowerKeyword) ||
      agent.description.toLowerCase().includes(lowerKeyword)
    );
  }, []);

  const createAgent = useCallback(async ({ name, emoji, description, prompt, category }: {
    name: string; emoji?: string; description?: string; prompt: string; category?: string;
  }): Promise<boolean> => {
    if (!name || name.length < 1 || name.length > 20) return false;
    if (!prompt || prompt.length < 10 || prompt.length > 2000) return false;

    const agent: CustomAgent = {
      id: 'custom_' + Date.now(),
      name,
      emoji: emoji || '🤖',
      avatar: null,
      prompt,
      description: description || '自定义智能体',
      category: category || 'work',
      promptFile: '',
      isCustom: true,
    };

    try {
      let customAgents = (await IDBStore.getAgentConfig('customAgents')) as CustomAgent[] | null || [];
      customAgents.push(agent);
      await IDBStore.setAgentConfig('customAgents', customAgents);

      const config = useAgentStore.getState().agentsConfig;
      if (config?.agents) {
        config.agents.push(agent as unknown as AgentItem);
        useAgentStore.getState().setAgentsConfig({ ...config });
      }
      return true;
    } catch (error) {
      console.error('创建智能体失败:', error);
      return false;
    }
  }, []);

  const deleteCustomAgent = useCallback(async (agentId: string): Promise<boolean> => {
    try {
      let customAgents = (await IDBStore.getAgentConfig('customAgents')) as CustomAgent[] | null || [];
      customAgents = customAgents.filter(a => a.id !== agentId);
      await IDBStore.setAgentConfig('customAgents', customAgents);

      const config = useAgentStore.getState().agentsConfig;
      if (config?.agents) {
        config.agents = config.agents.filter(a => a.id !== agentId);
        useAgentStore.getState().setAgentsConfig({ ...config });
      }
      return true;
    } catch (error) {
      console.error('删除智能体失败:', error);
      return false;
    }
  }, []);

  const createCategory = useCallback(async (name: string): Promise<boolean> => {
    if (!name || name.length < 1 || name.length > 10) return false;

    const config = useAgentStore.getState().agentsConfig;
    const existingNames = config?.categories?.map(c => c.name) || [];
    if (existingNames.includes(name)) return false;

    const category: CustomCategory = {
      id: 'custom_category_' + Date.now(),
      name,
      isCustom: true,
    };

    try {
      let customCategories = (await IDBStore.getAgentConfig('customCategories')) as CustomCategory[] | null || [];
      customCategories.push(category);
      await IDBStore.setAgentConfig('customCategories', customCategories);

      if (config?.categories) {
        const insertIdx = config.categories.findIndex(c => c.id === 'mine');
        if (insertIdx > 0) config.categories.splice(insertIdx, 0, category as unknown as AgentCategory);
        else config.categories.push(category as unknown as AgentCategory);
        useAgentStore.getState().setAgentsConfig({ ...config });
      }
      return true;
    } catch (error) {
      console.error('创建分类失败:', error);
      return false;
    }
  }, []);

  const deleteCategory = useCallback(async (categoryId: string): Promise<boolean> => {
    try {
      let customCategories = (await IDBStore.getAgentConfig('customCategories')) as CustomCategory[] | null || [];
      customCategories = customCategories.filter(c => c.id !== categoryId);
      await IDBStore.setAgentConfig('customCategories', customCategories);

      const config = useAgentStore.getState().agentsConfig;
      if (config?.categories) {
        config.categories = config.categories.filter(c => c.id !== categoryId);
        useAgentStore.getState().setAgentsConfig({ ...config });
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
