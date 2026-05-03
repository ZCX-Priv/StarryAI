/* ─── App ────────────────────────────────────────────── */
const App = {
  async enter() {
    document.getElementById('app').classList.add('visible');
    await Keys._loadModels();
    if (!state.chats.length) Chat.create();
    else { UI.renderChatList(); UI.renderMessages(); UI.updateTopbar(); }
    UI.updateMemoryBadge(); UI.renderModelPill(); UI.initScrollDetection();
    UI.initDropdowns(); UI.initInputListeners(); UI.updateSendButton();
    requestAnimationFrame(drawChatHoneycomb);
    window.addEventListener('resize', ()=>requestAnimationFrame(drawChatHoneycomb),{passive:true});
  }
};

/* ─── Bootstrap ─────────────────────────────────────── */
async function init() {
  Theme.apply(localStorage.getItem(KEYS.KEYS_MAP.THEME)||'auto');
  state.honeycomb = localStorage.getItem('pollen_honeycomb') !== '0';
  state.keys   = Store.load(KEYS.KEYS_MAP.KEYS, []);
  state.memory = Store.load(KEYS.KEYS_MAP.MEMORY, []);
  state.chats  = Store.load(KEYS.KEYS_MAP.CHATS, []);
  state.model  = localStorage.getItem(KEYS.KEYS_MAP.MODEL)||'nova-fast';
  state.activeChatId = localStorage.getItem(KEYS.KEYS_MAP.ACTIVE_CHAT);
  App.enter();
}
init();
