import { useState, useCallback, useEffect, useMemo } from 'react';
import { Menu, Plus, Search, Users } from 'lucide-react';
import { useAgentStore, useUiStore } from '@/status';
import { IDBStore } from '@/services/storage';
import useAgents from '@/hooks/useAgents';
import type { AgentItem, AgentCategory, AgentsConfig } from '@/types';
import AgentSearch from './AgentSearch';
import CategoryTabs from './CategoryTabs';
import AgentCard from './AgentCard';
import EmptyState from '@/components/ui/EmptyState';

type CustomAgent = Omit<AgentItem, 'avatar'> & {
  isCustom: boolean;
  prompt: string;
  emoji?: string;
  avatar: string | null;
};

type CustomCategory = Omit<AgentCategory, 'icon'> & {
  isCustom: boolean;
  icon?: string;
};

interface AgentsPageProps {
  onOpenModal: (modal: string) => void;
  onToggleSidebar: React.RefObject<(() => void) | null>;
}

export default function AgentsPage({ onOpenModal, onToggleSidebar }: AgentsPageProps) {
  const agentsConfig = useAgentStore(s => s.agentsConfig);
  const setAgentsConfig = useAgentStore(s => s.setAgentsConfig);
  const currentAgentId = useAgentStore(s => s.currentAgentId);
  const showToast = useUiStore(s => s.showToast);
  const { select: selectAgent } = useAgents();
  const [currentCategory, setCurrentCategory] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    if (agentsConfig) return;
    (async () => {
      try {
        const response = await fetch('/agents.json');
        if (!response.ok) throw new Error('Failed');
        const config = await response.json() as AgentsConfig;
        const customAgents = (await IDBStore.getAgentConfig('customAgents')) as unknown as CustomAgent[] || [];
        const customCategories = (await IDBStore.getAgentConfig('customCategories')) as unknown as CustomCategory[] || [];
        const existingIds = new Set(config.agents.map(a => a.id));
        customAgents.forEach(a => { if (!existingIds.has(a.id)) config.agents.push(a as unknown as AgentItem); });
        const existingCatIds = new Set(config.categories.map(c => c.id));
        customCategories.forEach(c => {
          if (!existingCatIds.has(c.id)) {
            const idx = config.categories.findIndex(cat => cat.id === 'mine');
            if (idx > 0) config.categories.splice(idx, 0, c as unknown as AgentCategory);
            else config.categories.push(c as unknown as AgentCategory);
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
      result = result.filter(a => 'isCustom' in a && (a as CustomAgent).isCustom);
    } else if (currentCategory !== 'all') {
      result = result.filter(a => a.category === currentCategory);
    }
    if (searchKeyword) {
      const lower = searchKeyword.toLowerCase();
      result = result.filter(a =>
        a.name.toLowerCase().includes(lower) || a.description.toLowerCase().includes(lower)
      );
    }
    return result;
  }, [agents, currentCategory, searchKeyword]);

  const handleSelectAgent = useCallback(async (agentId: string) => {
    await selectAgent(agentId);
    showToast(`已切换到${agents.find(a => a.id === agentId)?.name || '智能体'}`);
  }, [agents, selectAgent, showToast]);

  const handleDeleteAgent = useCallback(async (agentId: string) => {
    try {
      let customAgents = (await IDBStore.getAgentConfig('customAgents')) as unknown as CustomAgent[] || [];
      customAgents = customAgents.filter(a => a.id !== agentId);
      await IDBStore.setAgentConfig('customAgents', customAgents as unknown as CustomAgent[]);
      if (agentsConfig && agentsConfig.agents) {
        agentsConfig.agents = agentsConfig.agents.filter(a => a.id !== agentId);
        setAgentsConfig({ ...agentsConfig });
      }
      showToast('智能体已删除', 'info');
    } catch {
      showToast('删除失败，请重试', 'error');
    }
  }, [agentsConfig, setAgentsConfig, showToast]);

  const handleDeleteCategory = useCallback(async (categoryId: string) => {
    try {
      let customCategories = (await IDBStore.getAgentConfig('customCategories')) as unknown as CustomCategory[] || [];
      customCategories = customCategories.filter(c => c.id !== categoryId);
      await IDBStore.setAgentConfig('customCategories', customCategories as unknown as CustomCategory[]);
      if (agentsConfig && agentsConfig.categories) {
        agentsConfig.categories = agentsConfig.categories.filter(c => c.id !== categoryId);
        setAgentsConfig({ ...agentsConfig });
      }
      showToast('分类已删除', 'info');
      if (currentCategory === categoryId) setCurrentCategory('all');
    } catch {
      showToast('删除失败，请重试', 'error');
    }
  }, [agentsConfig, setAgentsConfig, showToast, currentCategory]);

  return (
    <>
      <div id="agents-topbar">
        <div className="tb-left">
          <button className="tb-toggle" onClick={() => onToggleSidebar.current?.()}>
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
          categories={categories as unknown as CustomCategory[]}
          currentCategory={currentCategory}
          onSelect={setCurrentCategory}
          onAddCategory={() => onOpenModal('createCategory')}
          onDeleteCategory={handleDeleteCategory}
        />
        {filteredAgents.length === 0 ? (
          searchKeyword ? (
            <EmptyState icon={Search} title="未找到匹配的智能体" description="尝试其他关键词" />
          ) : currentCategory === 'mine' ? (
            <EmptyState icon={Users} title="暂无智能体" description="创建一个专属 AI 智能体" />
          ) : (
            <EmptyState icon={Users} title="该分类暂无智能体" />
          )
        ) : (
        <div className="agents-grid">
          {filteredAgents.map(agent => (
            <AgentCard
                key={agent.id}
                agent={agent as unknown as CustomAgent}
                isCurrent={agent.id === currentAgentId}
                onSelect={handleSelectAgent}
                onDelete={handleDeleteAgent}
              />
            ))}
        </div>
        )}
      </div>
    </>
  );
}
