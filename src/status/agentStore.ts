import { create } from 'zustand';
import type { AgentsConfig } from '@/types';

interface AgentState {
  currentAgentId: string | null;
  agentPrompt: string | null;
  agentsConfig: AgentsConfig | null;
}

interface AgentActions {
  setCurrentAgentId: (id: string | null) => void;
  setAgentPrompt: (p: string | null) => void;
  setAgentsConfig: (config: AgentsConfig | null) => void;
}

type AgentStore = AgentState & AgentActions;

const useAgentStore = create<AgentStore>((set) => ({
  currentAgentId: null,
  agentPrompt: null,
  agentsConfig: null,

  setCurrentAgentId: (id) => set({ currentAgentId: id }),
  setAgentPrompt: (p) => set({ agentPrompt: p }),
  setAgentsConfig: (config) => set({ agentsConfig: config }),
}));

export default useAgentStore;
