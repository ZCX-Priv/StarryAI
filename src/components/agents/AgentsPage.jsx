import { useState, useCallback, useEffect, useMemo } from 'react';
import { Menu, Plus } from 'lucide-react';
import useAppStore from '@/store/useAppStore';
import { IDBStore } from '@/services/storage';
import AgentSearch from './AgentSearch';
import CategoryTabs from './CategoryTabs';
import AgentCard from './AgentCard';

export default function AgentsPage({ onOpenModal, onToggleSidebar }) {
  const agentsConfig = useAppStore(s => s.agentsConfig);
  const setAgentsConfig = useAppStore(s => s.setAgentsConfig);
  const setCurrentPage = useAppStore(s => s.setCurrentPage);
  const setCurrentAgentId = useAppStore(s => s.setCurrentAgentId);
  const setAgentPrompt = useAppStore(s => s.setAgentPrompt);
  const showToast = useAppStore(s => s.showToast);
  const [currentCategory, setCurrentCategory] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    if (agentsConfig) return;
    (async () => {
      try {
        const response = await fetch('/agents.json');
        if (!response.ok) throw new Error('Failed');
        const config = await response.json();
        const customAgents = await IDBStore.getAgentConfig('customAgents') || [];
        const customCategories = await IDBStore.getAgentConfig('customCategories') || [];
        const existingIds = new Set(config.agents.map(a => a.id));
        customAgents.forEach(a => { if (!existingIds.has(a.id)) config.agents.push(a); });
        const existingCatIds = new Set(config.categories.map(c => c.id));
        customCategories.forEach(c => {
          if (!existingCatIds.has(c.id)) {
            const idx = config.categories.findIndex(cat => cat.id === 'mine');
            if (idx > 0) config.categories.splice(idx, 0, c);
            else config.categories.push(c);
          }
        });
        setAgentsConfig(config);
      } catch (e) {
        console.error('Agents config load error:', e);
      }
    })();
  }, [agentsConfig, setAgentsConfig]);

  const categories = useMemo(() => agentsConfig?.categories || [], [agentsConfig]);
  const agents = useMemo(() => agentsConfig?.agents || [], [agentsConfig]);

  const filteredAgents = useMemo(() => {
    let result = agents;
    if (currentCategory === 'mine') {
      result = agents.filter(a => a.isCustom);
    } else if (currentCategory !== 'all') {
      result = agents.filter(a => a.category === currentCategory);
    }
    if (searchKeyword) {
      const lower = searchKeyword.toLowerCase();
      result = result.filter(a =>
        a.name.toLowerCase().includes(lower) || a.description.toLowerCase().includes(lower)
      );
    }
    return result;
  }, [agents, currentCategory, searchKeyword]);

  const handleSelectAgent = useCallback(async (agentId) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;
    setCurrentAgentId(agentId);
    let prompt;
    if (agent.isCustom) {
      prompt = agent.prompt;
    } else {
      try {
        const response = await fetch(`/prompts/agents/${agent.prompt}`);
        if (response.ok) prompt = await response.text();
      } catch {}
    }
    setAgentPrompt(prompt);
    showToast(`已切换到${agent.name}`);
    setCurrentPage('chat');
  }, [agents, setCurrentAgentId, setAgentPrompt, showToast, setCurrentPage]);

  const handleDeleteAgent = useCallback(async (agentId) => {
    try {
      let customAgents = await IDBStore.getAgentConfig('customAgents') || [];
      customAgents = customAgents.filter(a => a.id !== agentId);
      await IDBStore.setAgentConfig('customAgents', customAgents);
      if (agentsConfig && agentsConfig.agents) {
        agentsConfig.agents = agentsConfig.agents.filter(a => a.id !== agentId);
        setAgentsConfig({ ...agentsConfig });
      }
      showToast('智能体已删除');
    } catch {
      showToast('删除失败，请重试');
    }
  }, [agentsConfig, setAgentsConfig, showToast]);

  const handleDeleteCategory = useCallback(async (categoryId) => {
    try {
      let customCategories = await IDBStore.getAgentConfig('customCategories') || [];
      customCategories = customCategories.filter(c => c.id !== categoryId);
      await IDBStore.setAgentConfig('customCategories', customCategories);
      if (agentsConfig && agentsConfig.categories) {
        agentsConfig.categories = agentsConfig.categories.filter(c => c.id !== categoryId);
        setAgentsConfig({ ...agentsConfig });
      }
      showToast('分类已删除');
      if (currentCategory === categoryId) setCurrentCategory('all');
    } catch {
      showToast('删除失败，请重试');
    }
  }, [agentsConfig, setAgentsConfig, showToast, currentCategory]);

  return (
    <>
      <div id="agents-topbar">
        <div className="tb-left">
          <button className="tb-toggle" onClick={() => onToggleSidebar?.current?.()}>
            <Menu size={17} />
          </button>
          <span className="tb-title">智能体广场</span>
        </div>
      </div>
      <div id="agents-content">
        <div className="agents-search-wrapper">
          <AgentSearch
            value={searchKeyword}
            onChange={setSearchKeyword}
            onClear={() => setSearchKeyword('')}
          />
          <button className="create-agent-btn" onClick={() => onOpenModal('createAgent')}>
            <Plus size={14} />
            <span>创建 AI 智能体</span>
          </button>
        </div>
        <CategoryTabs
          categories={categories}
          currentCategory={currentCategory}
          onSelect={setCurrentCategory}
          onAddCategory={() => onOpenModal('createCategory')}
          onDeleteCategory={handleDeleteCategory}
        />
        <div className="agents-grid">
          {filteredAgents.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onSelect={handleSelectAgent}
              onDelete={handleDeleteAgent}
            />
          ))}
        </div>
      </div>
    </>
  );
}
