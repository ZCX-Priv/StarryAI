import { create } from 'zustand';
import { DEFAULT_MODELS } from '@/lib/config';

const useAppStore = create((set, get) => ({
  keys: [],
  activeKey: null,
  chats: [],
  activeChatId: null,
  memory: [],
  theme: 'auto',
  model: 'nova-fast',
  models: DEFAULT_MODELS,
  lang: 'zh',
  isStreaming: false,
  stopRequested: false,
  autoScroll: true,
  honeycomb: true,
  settingsTab: 'appearance',
  currentBannerMode: null,
  bannerPrompt: null,
  mainPromptTemplate: null,
  memoryExtractTemplate: null,
  memoryDeduplicateTemplate: null,
  currentAgentId: null,
  agentPrompt: null,
  currentMode: 'fast',
  modePrompt: null,
  temperature: 0.7,
  topP: 0.95,
  contextLength: 10,
  modeConfig: {
    fast: { reasoning_effort: "none", thinking: { type: "disabled" }, temperature: 0.8, useTools: false },
    thinking: { reasoning_effort: "high", thinking: { type: "enabled" }, temperature: 0.7, useTools: false },
    expert: { reasoning_effort: "xhigh", thinking: { type: "enabled" }, temperature: 0.6, model: "perplexity-reasoning", useTools: true }
  },
  currentPage: 'chat',
  agentsConfig: null,
  bannerConfig: null,
  toastMessage: null,
  toastVisible: false,
  streamingText: '',
  honeycombNeedsRedraw: false,

  // Actions
  setKeys: (keys) => set({ keys }),
  setActiveKey: (key) => set({ activeKey: key }),
  setChats: (chats) => set({ chats }),
  setActiveChatId: (id) => set({ activeChatId: id }),
  setMemory: (memory) => set({ memory }),
  setTheme: (theme) => set({ theme }),
  setModel: (model) => set({ model }),
  setModels: (models) => set({ models }),
  setIsStreaming: (v) => set({ isStreaming: v }),
  setStopRequested: (v) => set({ stopRequested: v }),
  setAutoScroll: (v) => set({ autoScroll: v }),
  setHoneycomb: (v) => set({ honeycomb: v }),
  setSettingsTab: (tab) => set({ settingsTab: tab }),
  setCurrentBannerMode: (mode) => set({ currentBannerMode: mode }),
  setBannerPrompt: (prompt) => set({ bannerPrompt: prompt }),
  setMainPromptTemplate: (t) => set({ mainPromptTemplate: t }),
  setMemoryExtractTemplate: (t) => set({ memoryExtractTemplate: t }),
  setMemoryDeduplicateTemplate: (t) => set({ memoryDeduplicateTemplate: t }),
  setCurrentAgentId: (id) => set({ currentAgentId: id }),
  setAgentPrompt: (p) => set({ agentPrompt: p }),
  setCurrentMode: (mode) => set({ currentMode: mode }),
  setModePrompt: (p) => set({ modePrompt: p }),
  setTemperature: (v) => set({ temperature: v }),
  setTopP: (v) => set({ topP: v }),
  setContextLength: (v) => set({ contextLength: v }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setAgentsConfig: (config) => set({ agentsConfig: config }),
  setBannerConfig: (config) => set({ bannerConfig: config }),
  setStreamingText: (text) => set({ streamingText: text }),
  triggerHoneycombRedraw: () => set({ honeycombNeedsRedraw: true }),
  clearHoneycombRedraw: () => set({ honeycombNeedsRedraw: false }),

  showToast: (msg) => {
    set({ toastMessage: msg, toastVisible: true });
    setTimeout(() => set({ toastVisible: false }), 2500);
  },

  createChat: () => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    const chat = { id, title: '新对话', messages: [], createdAt: Date.now(), model: get().model, agentId: get().currentAgentId };
    const chats = [chat, ...get().chats];
    set({ chats, activeChatId: chat.id, currentPage: 'chat' });
    return chat;
  },

  switchToChat: (id) => {
    set({ activeChatId: id, currentPage: 'chat' });
  },

  deleteChat: (id) => {
    const chats = get().chats.filter(c => c.id !== id);
    let activeChatId = get().activeChatId;
    if (activeChatId === id) {
      activeChatId = chats[0]?.id || null;
    }
    set({ chats, activeChatId });
    return { chats, activeChatId };
  },

  addMessage: (role, content) => {
    const chat = get().chats.find(c => c.id === get().activeChatId);
    if (!chat) return;
    chat.messages.push({ role, content, rendered: content, ts: Date.now() });
    if (chat.messages.length === 2 && role === 'assistant') {
      const u = chat.messages[0]?.content || '';
      chat.title = u.slice(0, 42) + (u.length > 42 ? '…' : '');
    }
    set({ chats: [...get().chats] });
  },

  renameChat: (chatId, newTitle) => {
    const chat = get().chats.find(c => c.id === chatId);
    if (chat) {
      chat.title = newTitle || '新对话';
      set({ chats: [...get().chats] });
    }
  },

  addMemoryItems: (items) => {
    set({ memory: [...get().memory, ...items] });
  },

  setMemoryItems: (items) => {
    set({ memory: items });
  },

  editMemoryItem: (index, value) => {
    const memory = [...get().memory];
    memory[index] = value;
    set({ memory });
  },

  deleteMemoryItem: (index) => {
    const memory = get().memory.filter((_, i) => i !== index);
    set({ memory });
  },

  clearMemory: () => set({ memory: [] }),

  addKey: (key) => {
    if (!get().keys.includes(key)) {
      set({ keys: [...get().keys, key] });
    }
  },

  deleteKey: (key) => {
    const keys = get().keys.filter(k => k !== key);
    let activeKey = get().activeKey;
    if (activeKey === key) {
      activeKey = keys[0] || null;
    }
    set({ keys, activeKey });
  },

  activateKey: (key) => set({ activeKey: key }),
}));

export default useAppStore;
