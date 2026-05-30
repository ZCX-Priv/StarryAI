/* ─── 应用 ────────────────────────────────────────────── */
const App = {
  async enter() {
    document.getElementById('app').classList.add('visible');
    await Keys._loadModels();
    await Banner.loadConfig();
    Banner.renderActions();
    if (!state.chats.length) Chat.create();
    else { UI.renderChatList(); UI.renderMessages(); UI.updateTopbar(); }
    UI.updateMemoryBadge(); UI.renderModelPill(); UI.initScrollDetection();
    UI.initDropdowns(); UI.initInputListeners(); UI.updateSendButton();
    requestAnimationFrame(drawChatHoneycomb);
    window.addEventListener('resize', ()=>requestAnimationFrame(drawChatHoneycomb),{passive:true});
    
    const createAgentBtn = document.querySelector('.create-agent-btn');
    if (createAgentBtn) {
      createAgentBtn.addEventListener('click', () => {
        Agents.openCreateModal();
      });
    }
  }
};

/* ─── 启动 ─────────────────────────────────────────────── */
async function init() {
  try {
    await IDBStore.init();
    await Migration.run();
  } catch (error) {
    console.error('IndexedDB 初始化失败，使用 localStorage 模式:', error);
    Store._useIDB = false;
  }

  const theme = await Store.loadConfig('theme', 'auto');
  Theme.apply(theme);
  
  const honeycomb = await Store.loadConfig('honeycomb', true);
  state.honeycomb = honeycomb === true || honeycomb === 'true' || honeycomb === '1';
  
  state.keys = await Store.loadKeys();
  state.memory = await Store.loadMemory();
  state.chats = await Store.loadChats();
  state.model = await Store.loadConfig('model', 'nova-fast');
  state.activeChatId = await Store.loadConfig('activeChatId', null);
  state.activeKey = await Store.loadActiveKey();
  
  state.temperature = parseFloat(await Store.loadConfig('temperature', '0.7')) || 0.7;
  state.topP = parseFloat(await Store.loadConfig('topP', '0.95')) || 0.95;
  state.contextLength = parseInt(await Store.loadConfig('contextLength', '10')) || 10;
  
  const currentAgentId = await IDBStore.getAgentConfig('currentAgentId');
  if (currentAgentId) state.currentAgentId = currentAgentId;
  
  const currentMode = await Store.loadConfig('currentMode', 'fast');
  state.currentMode = currentMode;
  await Prompts.loadModePrompt(currentMode);
  
  await Prompts.loadMainPrompt();
  await Prompts.loadMemoryPrompts();
  await Agents.init();
  App.enter();
  
  UI.updateModeButton();
  
  document.addEventListener('click', () => {
    document.querySelectorAll('.ci-dropdown.show').forEach(m => m.classList.remove('show'));
  });
}
init();
