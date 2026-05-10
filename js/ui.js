/* ─── UI ────────────────────────────────────────────── */
const UI = {
  _toastT: null,
  _closeSidebarMobile() {
    if (window.innerWidth<=680) {
      document.getElementById('sidebar').classList.remove('open');
      document.getElementById('sb-overlay').classList.remove('visible');
    }
  },
  showToast(msg) {
    const el=document.getElementById('toast');
    el.textContent=msg; el.classList.add('show');
    clearTimeout(UI._toastT); UI._toastT=setTimeout(()=>el.classList.remove('show'),2500);
  },
  autoResize(el) { el.style.height='auto'; el.style.height=Math.min(el.scrollHeight,168)+'px'; },
  focusInput() {
    if (!('ontouchstart' in window) && !navigator.maxTouchPoints) {
      document.getElementById('msg-input').focus();
    }
  },
  handleInputKey(e) { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();Chat.send();} },
  togglePasswordVis(id) {
    const el=document.getElementById(id);
    if (el) el.type = el.type==='password' ? 'text' : 'password';
  },
  setStreaming(v) {
    state.isStreaming=v;
    document.getElementById('send-btn').classList.toggle('hidden',v);
    document.getElementById('stop-btn').classList.toggle('visible',v);
    const ss=document.getElementById('stream-status');
    if (ss) { ss.classList.toggle('visible',v); if (!v) ss.classList.remove('code-mode'); }
  },
  updateStreamStatus(text) {
    const ss=document.getElementById('stream-status'), st=document.getElementById('stream-status-text');
    if (!ss||!st) return;
    const isCode=text.includes('```');
    ss.classList.toggle('code-mode',isCode);
    st.textContent=isCode ? '正在生成代码…' : '正在生成回复…';
  },
  updateSendButton() {
    const input=document.getElementById('msg-input');
    const sendBtn=document.getElementById('send-btn');
    if (!input||!sendBtn) return;
    const hasText=input.value.trim().length>0;
    sendBtn.disabled=!hasText;
    sendBtn.classList.toggle('active',hasText);
  },
  chatArea() { return document.getElementById('chat-area'); },
  scrollToBottom(force=true) {
    const area=UI.chatArea(); if (!area) return;
    if (force) state.autoScroll=true;
    area.scrollTo({top:area.scrollHeight, behavior:force?'smooth':'instant'});
    document.getElementById('scroll-btn').classList.remove('visible');
  },
  maybeScroll() {
    if (state.autoScroll) { const a=UI.chatArea(); if (a) a.scrollTop=a.scrollHeight; }
  },
  initScrollDetection() {
    let _scrollTick=false;
    UI.chatArea().addEventListener('scroll', () => {
      if (_scrollTick) return;
      _scrollTick=true;
      requestAnimationFrame(()=>{
        _scrollTick=false;
        const a=UI.chatArea();
        const atBottom=(a.scrollHeight-a.scrollTop-a.clientHeight)<60;
        state.autoScroll=atBottom;
        document.getElementById('scroll-btn').classList.toggle('visible',!atBottom);
      });
    },{passive:true});
  },
  addTypingIndicator() {
    const c=document.getElementById('messages');
    const row=document.createElement('div');
    row.className='msg-row ai'; row.id='typing-row';
    row.innerHTML=`<div class="ai-msg-content"><div class="typing-indicator"><div class="td"></div><div class="td"></div><div class="td"></div></div></div>`;
    c.appendChild(row);
    if (state.autoScroll) UI.scrollToBottom(false);
    return row;
  },
  addBubble(role, content, rendered = null) {
    const c=document.getElementById('messages');
    c.querySelector('.empty-state')?.remove();
    const isAI=role==='assistant';
    const row=document.createElement('div');
    row.className=`msg-row ${role}`;
    let bubbleContent = rendered || (isAI ? Renderer.parseMarkdown(content) : Renderer.escHtml(content));
    let collapseHtml='';
    if (!isAI && content.length>80) {
      const prev=Renderer.escHtml(content.slice(0,80));
      bubbleContent=`<span class="msg-text-full" style="display:none">${Renderer.escHtml(content)}</span><span class="msg-text-preview">${prev}…</span>`;
      collapseHtml=`<br><button class="msg-collapse-btn" onclick="UI.toggleMsgCollapse(this)"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg> 查看全部</button>`;
    }
    if (isAI) {
      row.innerHTML=`<div class="ai-msg-content">${bubbleContent}</div>`;
    } else {
      row.innerHTML=`
      <div class="msg-bubble">${bubbleContent}${collapseHtml}</div>
      <div class="msg-avatar"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>`;
    }
    c.appendChild(row);
    
    if (isAI) {
      FormulaRenderer.typeset(row.querySelector('.ai-msg-content'));
    }
    
    return row.querySelector(isAI?'.ai-msg-content':'.msg-bubble');
  },
  toggleMsgCollapse(btn) {
    const bubble=btn.closest('.msg-bubble');
    const full=bubble.querySelector('.msg-text-full'), prev=bubble.querySelector('.msg-text-preview');
    const expanded=full.style.display!=='none';
    full.style.display=expanded?'none':'inline'; prev.style.display=expanded?'inline':'none';
    const pts=expanded?'6 9 12 15 18 9':'18 15 12 9 6 15';
    btn.innerHTML=`<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="${pts}"/></svg> ${expanded?'查看全部':'收起'}`;
  },
  collapseAllUserMsgs() {
    document.querySelectorAll('.msg-row.user .msg-bubble').forEach(b => {
      const full=b.querySelector('.msg-text-full'), prev=b.querySelector('.msg-text-preview'), btn=b.querySelector('.msg-collapse-btn');
      if (full&&prev) { full.style.display='none'; prev.style.display='inline'; }
      if (btn) btn.innerHTML=`<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg> 查看全部`;
    });
  },
  addMessageActions(lastRow) {
    if (!lastRow||lastRow.classList.contains('msg-actions')) return;
    const acts=document.createElement('div'); acts.className='msg-actions';
    setTimeout(()=>acts.classList.add('visible'),600);
    acts.innerHTML=`
      <button class="msg-action-btn" onclick="Chat.regenerate()"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg> 重新生成</button>
      <button class="msg-action-btn" onclick="Chat.copyLastResponse()"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> 复制</button>`;
    document.getElementById('messages').appendChild(acts);
  },
  openModal(type) {
    if (type==='settings') { document.getElementById('settings-modal').classList.add('visible'); Modals.renderSettings(); }
    else if (type==='help') { document.getElementById('help-modal').classList.add('visible'); Modals.renderHelp(); }
    else if (type==='model') { document.getElementById('model-modal').classList.add('visible'); Modals.renderModelPicker(); }
    else { document.getElementById('memory-modal').classList.add('visible'); Modals.renderMemory(); }
  },
  showPage(page) {
    const main = document.getElementById('main');
    const agentsPage = document.getElementById('agents-page');
    if (page === 'chat') {
      main.classList.remove('hidden');
      agentsPage.classList.add('hidden');
    } else if (page === 'agents') {
      main.classList.add('hidden');
      agentsPage.classList.remove('hidden');
      Agents.renderPlaza();
      UI._closeSidebarMobile();
    }
  },
  closeModal(id) { document.getElementById(id).classList.remove('visible'); },
  updateTopbar() {
    const chat=Chat.getActive();
    const raw=chat?.title||'';
    document.getElementById('chat-title').textContent=(raw==='新对话'||!raw)?'新对话':(raw||'对话');
  },
  renderMessages() {
    const chat=Chat.getActive(), c=document.getElementById('messages');
    c.innerHTML='';
    if (!chat||!chat.messages.length) {
      c.innerHTML=`<div class="empty-state"><div class="empty-icon"><img src="logo.png" alt="Logo"></div><h2>我能帮您什么？</h2><p>开始对话，模型会自动了解您。</p></div>`;
      return;
    }
    chat.messages.forEach((msg,i)=>{
      UI.addBubble(msg.role, msg.content, msg.rendered);
      if (msg.role==='assistant'&&i===chat.messages.length-1) UI.addMessageActions(c.lastElementChild);
    });
    UI.scrollToBottom(false);
  },
  renderModelPill() {
    const lbl = document.getElementById('model-pill-label');
    if (lbl) {
      const currentModel = state.models.find(m => m.id === state.model);
      lbl.textContent = currentModel ? currentModel.label : state.model;
    }
  },
  updateThinkingModeVisibility() {
    const currentModel = state.models.find(m => m.id === state.model);
    const thinkingModeItem = document.querySelector('#quickMenu .dropdown-item[data-mode="thinking"]');
    if (thinkingModeItem) {
      thinkingModeItem.style.display = (currentModel && currentModel.reasoning) ? '' : 'none';
    }
  },
  updateModeButton() {
    const quickBtn = document.getElementById('quickBtn');
    const quickMenu = document.getElementById('quickMenu');
    if (!quickBtn || !quickMenu) return;
    
    const currentItem = quickMenu.querySelector(`.dropdown-item[data-mode="${state.currentMode}"]`);
    if (!currentItem) return;
    
    quickMenu.querySelectorAll('.dropdown-item').forEach(i => {
      i.classList.remove('active');
      const check = i.querySelector('.dropdown-check');
      if (check) check.remove();
    });
    currentItem.classList.add('active');
    const checkHtml = '<div class="dropdown-check"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 12L10 17L19 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>';
    currentItem.insertAdjacentHTML('beforeend', checkHtml);
    
    const label = currentItem.querySelector('.dropdown-item-header span').textContent;
    quickBtn.querySelector('span').textContent = label;
    
    const iconSvg = currentItem.getAttribute('data-icon');
    if (iconSvg) {
      const firstSvg = quickBtn.querySelector('svg[data-icon]');
      if (firstSvg) {
        firstSvg.outerHTML = iconSvg;
        const newSvg = quickBtn.querySelector('svg');
        if (newSvg) newSvg.setAttribute('data-icon', 'mode');
      }
    }
  },
  async resetModeToFast() {
    state.currentMode = 'fast';
    await Prompts.loadModePrompt('fast');
    if (window.Store) {
      Store.saveConfig('currentMode', 'fast');
    }
    UI.updateModeButton();
  },
  renderChatList() {
    const list=document.getElementById('chat-list'); list.innerHTML='';
    state.chats.forEach(chat => {
      const item=document.createElement('div');
      item.className='chat-item'+(chat.id===state.activeChatId?' active':'');
      item.onclick=()=>Chat.switchTo(chat.id);
      const displayTitle=(chat.title==='新对话'||!chat.title)?'新对话':chat.title;
      item.innerHTML=`<div class="ci-icon"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>
        <div class="ci-title">${Renderer.escHtml(displayTitle)}</div>
        <button class="ci-menu-btn" onclick="Chat.toggleMenu('${chat.id}',event)" title="更多操作">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="12" r="2"/>
            <circle cx="12" cy="12" r="2"/>
            <circle cx="19" cy="12" r="2"/>
          </svg>
        </button>
        <div class="ci-dropdown" id="menu-${chat.id}">
          <button class="ci-dropdown-item" onclick="Chat.openRename('${chat.id}',event)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            <span>编辑名称</span>
          </button>
          <button class="ci-dropdown-item ci-dropdown-danger" onclick="Chat.confirmDelete('${chat.id}',event)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            <span>删除对话</span>
          </button>
        </div>`;
      list.appendChild(item);
    });
  },
  updateMemoryBadge() {
    const count=state.memory.length, badge=document.getElementById('mem-badge');
    if (badge) { badge.textContent=count; badge.style.display=count>0?'inline-flex':'none'; }
    document.getElementById('brain-btn')?.classList.toggle('has-mem',count>0);
  },
  positionDropdown(menu, triggerBtn) {
    const rect=triggerBtn.getBoundingClientRect();
    const menuRect=menu.getBoundingClientRect();
    const gap=8;
    let top=rect.top-menuRect.height-gap;
    let left=rect.left;
    if (top<8) top=rect.bottom+gap;
    if (left+menuRect.width>window.innerWidth-8) left=window.innerWidth-menuRect.width-8;
    if (left<8) left=8;
    menu.style.top=top+'px';
    menu.style.left=left+'px';
  },
  toggleDropdown(menu, triggerBtn) {
    const isShown=menu.classList.contains('show');
    UI.closeAllDropdowns();
    if (!isShown) {
      UI.positionDropdown(menu, triggerBtn);
      menu.classList.add('show');
    }
  },
  closeAllDropdowns() {
    document.querySelectorAll('.dropdown-menu').forEach(m=>m.classList.remove('show'));
  },
  initDropdowns() {
    const quickBtn=document.getElementById('quickBtn');
    const quickMenu=document.getElementById('quickMenu');
    const moreBtn=document.getElementById('moreBtn');
    const moreMenu=document.getElementById('moreMenu');
    if (quickBtn&&quickMenu) {
      quickBtn.addEventListener('click', (e)=>{e.stopPropagation();UI.toggleDropdown(quickMenu, quickBtn);});
      quickMenu.querySelectorAll('.dropdown-item').forEach(item=>{
        item.addEventListener('click', async function() {
          const mode = this.getAttribute('data-mode');
          
          if (mode) {
            state.currentMode = mode;
            await Prompts.loadModePrompt(mode);
            if (window.Store) {
              Store.saveConfig('currentMode', mode);
            }
          }
          
          UI.updateModeButton();
          UI.closeAllDropdowns();
        });
      });
    }
    if (moreBtn&&moreMenu) {
      moreBtn.addEventListener('click', (e)=>{e.stopPropagation();UI.toggleDropdown(moreMenu, moreBtn);});
      moreMenu.querySelectorAll('.dropdown-item').forEach(item=>{
          item.addEventListener('click', function() {
            const actionId=this.getAttribute('data-action');
            if (actionId && window.Banner) {
              const action = Banner.config?.actions.find(a => a.id === actionId);
              if (action) {
                Banner.handleAction(action);
              }
            } else {
              const label=this.querySelector('.dropdown-item-header span').textContent;
              const input=document.getElementById('msg-input');
              if (input) input.placeholder='在'+label+'模式下发消息...';
            }
            UI.closeAllDropdowns();
          });
        });
    }
    document.addEventListener('click', ()=>UI.closeAllDropdowns());
    document.querySelectorAll('.dropdown-menu').forEach(menu=>{
      menu.addEventListener('click', e=>e.stopPropagation());
    });
    window.addEventListener('resize', ()=>{
      if (quickMenu?.classList.contains('show')) UI.positionDropdown(quickMenu, quickBtn);
      if (moreMenu?.classList.contains('show')) UI.positionDropdown(moreMenu, moreBtn);
    });
  },
  initInputListeners() {
    const input=document.getElementById('msg-input');
    if (input) {
      input.addEventListener('input', function() {
        UI.autoResize(this);
        UI.updateSendButton();
      });
    }
  }
};
