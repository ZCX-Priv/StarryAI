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
  lang:          'pt',
  translations:  {},
  isStreaming:   false,
  stopRequested: false,
  autoScroll:    true,
  honeycomb:     true,
  settingsTab:   'keys',
};
