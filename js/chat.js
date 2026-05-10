/* ─── Chat ──────────────────────────────────────────── */
const Chat = {
  getActive() { return state.chats.find(c=>c.id===state.activeChatId); },
  addMsg(role, content) {
    const chat=Chat.getActive(); if (!chat) return;
    
    const rendered = role === 'assistant' ? Renderer.parseMarkdown(content) : Renderer.escHtml(content);
    
    chat.messages.push({role,content,rendered,ts:Date.now()});
    if (chat.messages.length===2&&role==='assistant') {
      const u=chat.messages[0]?.content||'';
      chat.title=u.slice(0,42)+(u.length>42?'…':'');
    }
    Store.saveChats();
  },
  create() {
    const id=Date.now().toString(36)+Math.random().toString(36).slice(2);
    const chat={id,title:'新对话',messages:[],createdAt:Date.now(),model:state.model,agentId:state.currentAgentId};
    state.chats.unshift(chat); state.activeChatId=chat.id;
    Store.saveChats(); Store.saveConfig('activeChatId', chat.id);
    UI.renderChatList(); UI.renderMessages(); UI.updateTopbar();
    UI.focusInput();
    UI._closeSidebarMobile();
  },
  switchTo(id) {
    state.activeChatId=id; Store.saveConfig('activeChatId', id);
    UI.renderChatList(); UI.renderMessages(); UI.updateTopbar();
    UI._closeSidebarMobile();
  },
  delete(id, e) {
    e.stopPropagation();
    state.chats=state.chats.filter(c=>c.id!==id);
    Store.deleteChat(id);
    if (state.activeChatId===id) {
      state.activeChatId=state.chats[0]?.id||null;
      if (!state.activeChatId) Chat.create();
      else Store.saveConfig('activeChatId', state.activeChatId);
    }
    Store.saveChats(); UI.renderChatList(); UI.renderMessages(); UI.updateTopbar();
  },
  toggleMenu(id, e) {
    e.stopPropagation();
    const menu = document.getElementById(`menu-${id}`);
    if (!menu) return;
    
    document.querySelectorAll('.ci-dropdown.show').forEach(m => {
      if (m.id !== `menu-${id}`) m.classList.remove('show');
    });
    
    menu.classList.toggle('show');
  },
  openRename(id, e) {
    e.stopPropagation();
    const chat = state.chats.find(c => c.id === id);
    if (!chat) return;
    
    document.getElementById(`menu-${id}`)?.classList.remove('show');
    
    const modal = document.getElementById('rename-modal');
    const input = document.getElementById('rename-input');
    input.value = chat.title === '新对话' ? '' : chat.title;
    modal.classList.add('visible');
    modal.dataset.chatId = id;
    input.focus();
    input.select();
  },
  rename() {
    const modal = document.getElementById('rename-modal');
    const input = document.getElementById('rename-input');
    const chatId = modal.dataset.chatId;
    const newTitle = input.value.trim() || '新对话';
    
    const chat = state.chats.find(c => c.id === chatId);
    if (chat) {
      chat.title = newTitle;
      Store.saveChats();
      UI.renderChatList();
      UI.updateTopbar();
    }
    
    UI.closeModal('rename-modal');
  },
  confirmDelete(id, e) {
    e.stopPropagation();
    
    document.getElementById(`menu-${id}`)?.classList.remove('show');
    
    const modal = document.getElementById('confirm-delete-modal');
    modal.classList.add('visible');
    modal.dataset.chatId = id;
  },
  executeDelete() {
    const modal = document.getElementById('confirm-delete-modal');
    const chatId = modal.dataset.chatId;
    
    state.chats = state.chats.filter(c => c.id !== chatId);
    Store.deleteChat(chatId);
    
    if (state.activeChatId === chatId) {
      state.activeChatId = state.chats[0]?.id || null;
      if (!state.activeChatId) Chat.create();
      else Store.saveConfig('activeChatId', state.activeChatId);
    }
    
    Store.saveChats();
    UI.renderChatList();
    UI.renderMessages();
    UI.updateTopbar();
    UI.closeModal('confirm-delete-modal');
  },
  async send() {
    const input=document.getElementById('msg-input');
    const text=input.value.trim();
    if (!text||state.isStreaming) return;
    if (!state.activeChatId) Chat.create();
    document.querySelector('.msg-actions')?.remove();
    UI.collapseAllUserMsgs();
    input.value=''; UI.autoResize(input);
    
    Chat.addMsg('user',text); UI.addBubble('user',text);
    UI.renderChatList(); UI.updateTopbar();
    await Chat._streamResponse();
  },
  async _streamResponse() {
    const chat=Chat.getActive();
    const allMsgs=chat.messages.filter(m=>m.role!=='system').map(m=>({role:m.role,content:m.content}));
    const msgs = state.contextLength > 0 ? allMsgs.slice(-state.contextLength) : [];
    
    let modelToUse=chat.model||state.model;
    if (state.currentMode === 'expert' && state.modeConfig.expert.model) {
      modelToUse = state.modeConfig.expert.model;
    }
    
    const typingRow=UI.addTypingIndicator();
    state.autoScroll=true; UI.scrollToBottom(false); UI.setStreaming(true); state.stopRequested=false;
    let fullResp='', aiBubble=null, streamFailed=false;
    try {
      let first=true;
      for await (const chunk of API.stream(msgs, modelToUse)) {
        if (first) { typingRow.remove(); aiBubble=UI.addBubble('assistant',''); aiBubble.classList.add('streaming'); first=false; }
        fullResp+=chunk; UI.updateStreamStatus(fullResp);
        if (aiBubble) Renderer.scheduleStream(fullResp, aiBubble);
        if (state.stopRequested) break;
      }
      if (aiBubble) { 
        aiBubble.classList.remove('streaming');
        
        const codeBlocks = aiBubble.querySelectorAll('.code-block-wrap');
        codeBlocks.forEach(wrap => {
          const body = wrap.querySelector('.code-block-body');
          const lines = body ? body.querySelectorAll('pre code').textContent?.split('\n').length || 0 : 0;
          if (lines > 8) {
            body.classList.add('collapsed');
          }
        });
      }
      if (first&&!state.stopRequested) { typingRow.remove(); streamFailed=true; }
      else if (first) { typingRow.remove(); }
    } catch { streamFailed=!state.stopRequested; typingRow?.remove(); }
    if (state.stopRequested) {
      if (fullResp) { Chat.addMsg('assistant',fullResp); Store.saveChats(); UI.renderChatList(); UI.updateTopbar(); }
      UI.setStreaming(false); UI.focusInput(); return;
    }
    if (streamFailed&&!fullResp) {
      const ft=UI.addTypingIndicator();
      try {
        const result=await API.fetch(msgs,modelToUse); ft.remove();
        if (result) { fullResp=result; aiBubble=UI.addBubble('assistant',result); }
      } catch(e) {
        ft.remove(); UI.addBubble('assistant',`⚠ ${Renderer.escHtml(e?.message||'Error')}`);
        UI.setStreaming(false); UI.focusInput(); return;
      }
    }
    
    if (state.currentMode === 'expert' && state.modeConfig.expert.useTools && fullResp) {
      const tools = Tools.parseToolTags(fullResp);
      if (tools.length > 0) {
        const toolResults = [];
        for (const tool of tools) {
          const result = await Tools.executeTool(tool);
          if (result) {
            toolResults.push(result);
          }
        }
        
        if (toolResults.length > 0) {
          fullResp = Tools.replaceToolTags(fullResp, toolResults);
          if (aiBubble) {
            aiBubble.classList.remove('streaming');
            
            const codeBlocks = aiBubble.querySelectorAll('.code-block-wrap');
            codeBlocks.forEach(wrap => {
              const body = wrap.querySelector('.code-block-body');
              const lines = body ? body.querySelectorAll('pre code').textContent?.split('\n').length || 0 : 0;
              if (lines > 8) {
                body.classList.add('collapsed');
              }
            });
          }
        }
      }
    }
    
    if (fullResp) {
      Chat.addMsg('assistant',fullResp); Store.saveChats(); UI.renderChatList(); UI.updateTopbar();
      const lastRow=document.getElementById('messages').lastElementChild;
      if (lastRow?.classList.contains('msg-row')) UI.addMessageActions(lastRow);
      UI.maybeScroll();
      Memory.extract(chat.messages.slice(-6));
    }
    UI.setStreaming(false); UI.focusInput();
  },
  async regenerate() {
    const chat=Chat.getActive(); if (!chat||state.isStreaming) return;
    if (chat.messages[chat.messages.length-1]?.role==='assistant') { chat.messages.pop(); Store.saveChats(); }
    UI.renderMessages();
    const allMsgs=chat.messages.map(m=>({role:m.role,content:m.content}));
    const msgs = state.contextLength > 0 ? allMsgs.slice(-state.contextLength) : [];
    const modelToUse=chat.model||state.model;
    document.querySelector('.msg-actions')?.remove();
    const typingRow=UI.addTypingIndicator();
    state.autoScroll=true; UI.scrollToBottom(false); UI.setStreaming(true); state.stopRequested=false;
    let fullResp='', aiBubble=null;
    try {
      let first=true;
      for await (const chunk of API.stream(msgs,modelToUse)) {
        if (first) { typingRow.remove(); aiBubble=UI.addBubble('assistant',''); aiBubble.classList.add('streaming'); first=false; }
        fullResp+=chunk;
        if (aiBubble) Renderer.scheduleStream(fullResp, aiBubble);
        if (state.stopRequested) break;
      }
      if (aiBubble) { 
        aiBubble.classList.remove('streaming');
        
        const codeBlocks = aiBubble.querySelectorAll('.code-block-wrap');
        codeBlocks.forEach(wrap => {
          const body = wrap.querySelector('.code-block-body');
          const lines = body ? body.querySelectorAll('pre code').textContent?.split('\n').length || 0 : 0;
          if (lines > 8) {
            body.classList.add('collapsed');
          }
        });
      }
      if (first) typingRow.remove();
    } catch(e) { typingRow?.remove(); UI.addBubble('assistant',`⚠ ${Renderer.escHtml(e?.message||'Error')}`); }
    if (fullResp) {
      Chat.addMsg('assistant',fullResp); Store.saveChats();
      const lastRow=document.getElementById('messages').lastElementChild;
      if (lastRow?.classList.contains('msg-row')) UI.addMessageActions(lastRow);
    }
    UI.setStreaming(false); UI.focusInput();
  },
  async copyLastResponse() {
    const chat=Chat.getActive();
    const last=[...chat.messages].reverse().find(m=>m.role==='assistant');
    if (!last) return;
    try { await navigator.clipboard.writeText(last.content); UI.showToast('已复制！'); } catch {}
  },
  stopGeneration() { state.stopRequested=true; UI.setStreaming(false); },
  handleModelChange() {
    const chat=Chat.getActive(); if (chat) { chat.model=state.model; Store.saveChats(); }
  }
};
