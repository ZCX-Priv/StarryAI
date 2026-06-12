import { create } from 'zustand';

const useAgentStore = create((set) => ({
  currentAgentId: null,
  agentPrompt: null,
  agentsConfig: null,

  setCurrentAgentId: (id) => set({ currentAgentId: id }),
  setAgentPrompt: (p) => set({ agentPrompt: p }),
  setAgentsConfig: (config) => set({ agentsConfig: config }),
}));

export default useAgentStore;
