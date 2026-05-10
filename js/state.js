/* ── State ───────────────────────────────────────────── */
let state = {
  keys:          [],
  activeKey:     null,
  chats:         [],
  activeChatId:  null,
  memory:        [],
  theme:         'auto',
  model:         'openai-fast',
  models:        DEFAULT_MODELS,
  lang:          'zh',
  translations:  {},
  isStreaming:   false,
  stopRequested: false,
  autoScroll:    true,
  honeycomb:     true,
  settingsTab:   'appearance',
  currentBannerMode: null,
  bannerPrompt:  null,
  mainPromptTemplate: null,
  memoryExtractTemplate: null,
  memoryDeduplicateTemplate: null,
  currentAgentId: null,
  agentPrompt:   null,
  currentMode: 'fast',
  modePrompt: null,
  modeConfig: {
    fast: {
      reasoning_effort: "none",
      thinking: { type: "disabled" },
      temperature: 0.8,
      useTools: false
    },
    thinking: {
      reasoning_effort: "high",
      thinking: { type: "enabled" },
      temperature: 0.7,
      useTools: false
    },
    expert: {
      reasoning_effort: "xhigh",
      thinking: { type: "enabled" },
      temperature: 0.6,
      model: "perplexity-reasoning",
      useTools: true
    }
  }
};
