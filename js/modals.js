/* ─── Modals ────────────────────────────────────────── */
const Modals = {
  renderSettings() {
    const body=document.getElementById('settings-body');
    if (state.settingsTab==='keys') {
      body.innerHTML=`<div class="sec-title">管理密钥</div>
        <div class="sec-card">
          ${!state.keys.length?`<div style="padding:16px;color:var(--text2);font-size:13.5px">未保存密钥。</div>`:''}
          ${state.keys.map(k=>`<div class="key-item">
            <div class="ki-text"><div class="ki-label">${k.slice(0,6)}${'•'.repeat(8)}${k.slice(-4)}</div>
            <div class="ki-val">${k===state.activeKey?'● 已激活':'未激活'}</div></div>
            ${k!==state.activeKey?`<button class="btn-sm ghost" onclick="Keys.activate('${k}')">使用</button>`:`<span class="ki-badge active">已激活</span>`}
            <button class="btn-sm danger" onclick="Keys.delete('${k}')" style="padding:8px 10px"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg></button>
          </div>`).join('')}
        </div>
        <div class="add-form">
          <input type="password" id="new-key-input" placeholder="pk_…" autocomplete="off">
          <button class="btn-sm" onclick="Keys.add()">添加</button>
        </div>`;
    } else if (state.settingsTab==='model') {
      body.innerHTML=`<div class="sec-title">默认模型</div>
        <div class="sec-card" style="margin-bottom:20px">
          <div class="sec-row">
            <select class="model-selector" onchange="Keys.setModel(this.value)">
              ${state.models.map(m=>`
                <option value="${m.id}" ${state.model===m.id?'selected':''}>
                  ${Renderer.escHtml(m.label||m.id)}
                </option>
              `).join('')}
            </select>
          </div>
        </div>
        <div class="sec-title">温度</div>
        <div class="sec-card" style="margin-bottom:20px">
          <div class="sec-row slider-row">
            <div class="slider-container">
              <input type="range" class="slider" id="temperature-slider" min="0" max="2" step="0.1" value="${state.temperature}" oninput="Keys.setTemperature(this.value)">
              <div class="slider-info">
                <span class="slider-desc">控制回复的随机性，值越高越随机</span>
                <span class="slider-value" id="temperature-value">${state.temperature.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="sec-title">Top P</div>
        <div class="sec-card" style="margin-bottom:20px">
          <div class="sec-row slider-row">
            <div class="slider-container">
              <input type="range" class="slider" id="topp-slider" min="0" max="1" step="0.05" value="${state.topP}" oninput="Keys.setTopP(this.value)">
              <div class="slider-info">
                <span class="slider-desc">核采样参数，控制词汇多样性</span>
                <span class="slider-value" id="topp-value">${state.topP.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="sec-title">上下文长度</div>
        <div class="sec-card">
          <div class="sec-row slider-row">
            <div class="slider-container">
              <input type="range" class="slider" id="context-slider" min="0" max="25" step="1" value="${state.contextLength}" oninput="Keys.setContextLength(this.value)">
              <div class="slider-info">
                <span class="slider-desc">发送给 AI 的历史消息数量</span>
                <span class="slider-value" id="context-value">${state.contextLength} 条</span>
              </div>
            </div>
          </div>
        </div>`;
    } else {
      body.innerHTML=`<div class="sec-title">主题</div>
        <div class="sec-card" style="margin-bottom:20px">
          ${['auto','light','dark'].map(th=>`<div class="sec-row" style="cursor:pointer" onclick="Theme.apply('${th}');Modals.renderSettings()">
            <div class="sec-row-label">${th==='auto'?'自动':th==='dark'?'深色':'浅色'}</div>
            ${state.theme===th?`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent2)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`:''}
          </div>`).join('')}
        </div>
        <div class="sec-title">背景</div>
        <div class="sec-card">
          <div class="sec-row" style="cursor:pointer" onclick="setHoneycomb(!state.honeycomb);Modals.renderSettings()">
            <div class="sec-row-l"><div class="sec-row-label">动态蜂巢</div><div class="sec-row-desc">聊天界面背景装饰画布</div></div>
            <button class="toggle ${state.honeycomb?'on':''}" style="pointer-events:none"></button>
          </div>
        </div>`;
    }
  },
  renderMemory() {
    const body=document.getElementById('memory-body');
    if (!state.memory.length) {
      body.innerHTML=`<div style="text-align:center;padding:40px 20px;color:var(--text2)">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin:auto;display:block;opacity:.3"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>
        <div style="margin-top:14px;font-weight:500">尚无保存的记忆。</div>
        <div style="font-size:13px;margin-top:5px">AI 在对话过程中自动学习您的偏好。</div></div>`;
      return;
    }
    body.innerHTML=`<div style="font-size:13px;color:var(--text2);margin-bottom:12px">AI 在对话过程中自动学习您的偏好。</div>
      <div class="sec-card">${state.memory.map((m,i)=>`
        <div class="mem-item" id="mi-${i}">
          <div class="mem-num">${i+1}</div>
          <div class="mem-text" id="mt-${i}" contenteditable="false">${Renderer.escHtml(m)}</div>
          <div class="mem-acts">
            <button class="mem-btn" onclick="Memory.editItem(${i})"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
            <button class="mem-btn del" onclick="Memory.deleteItem(${i})"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg></button>
          </div>
        </div>`).join('')}</div>`;
  },
  async renderModelPicker() {
    const body = document.getElementById('model-body'); if(!body) return;
    const searchHTML = `<div class="mp-search-wrapper">
      <svg class="mp-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input type="text" class="mp-search-input" id="model-search-input" placeholder="搜索模型..." oninput="Modals.filterModels(this.value)">
      <button class="mp-search-clear" id="model-search-clear" onclick="Modals.clearModelSearch()" style="display:none">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>`;
    body.innerHTML = searchHTML + `<div class="mp-models-wrap"><div class="sec-card" style="margin:0" id="model-list-container"></div></div>`;
    Modals._renderModelList(state.models);
  },
  _renderModelList(models) {
    const container = document.getElementById('model-list-container');
    if (!container) return;
    const modelRows = models.map(m => {
      const active = m.id === state.model;
      const diamondIcon = m.paidOnly ? `<svg style="flex-shrink:0;margin-left:4px;color:#9CA3AF" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12,2 2,7 12,22 22,7"/><line x1="2" y1="7" x2="22" y2="7"/><line x1="12" y1="2" x2="12" y2="22"/></svg>` : '';
      const reasoningIcon = m.reasoning ? `<svg style="flex-shrink:0;margin-left:4px;color:var(--accent2)" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="12" r="5"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/></svg>` : '';
      const contextTag = m.contextLength ? `<span class="mp-context-tag">${formatContextLength(m.contextLength)}</span>` : '';
      return `<div class="mp-model-row${active?' mp-active':''}" onclick="Keys.setModelAndUpdate('${m.id}')">
        <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:0">
          ${active?`<div style="width:6px;height:6px;background:var(--accent2);border-radius:50%;flex-shrink:0"></div>`:`<div style="width:6px;height:6px;border-radius:50%;flex-shrink:0"></div>`}
          <span style="font-size:13.5px;font-weight:${active?'600':'400'};color:${active?'var(--accent2)':'var(--text)'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${Renderer.escHtml(m.label||m.id)}</span>${diamondIcon}${reasoningIcon}
        </div>
        <div style="display:flex;align-items:center;gap:6px">
          ${contextTag}
          ${active?`<svg style="flex-shrink:0;color:var(--accent2)" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`:'<div style="width:14px"></div>'}
        </div>
      </div>`;
    }).join('');
    container.innerHTML = modelRows;
  },
  filterModels(searchTerm) {
    const clearBtn = document.getElementById('model-search-clear');
    if (clearBtn) {
      clearBtn.style.display = searchTerm ? 'flex' : 'none';
    }
    const filteredModels = state.models.filter(m => {
      const label = (m.label || m.id).toLowerCase();
      const term = searchTerm.toLowerCase();
      return label.includes(term) || m.id.toLowerCase().includes(term);
    });
    Modals._renderModelList(filteredModels);
  },
  clearModelSearch() {
    const input = document.getElementById('model-search-input');
    if (input) {
      input.value = '';
      Modals.filterModels('');
    }
  },
  renderHelp() {
    const body = document.getElementById('help-body');
    const sections = [
      { title: '记忆功能介绍', icon: '<path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>', text: 'AI 会在对话中自动学习关于您的有用信息，包括姓名、偏好、沟通风格和兴趣。这些记忆保存在本地，用于个性化回复。您可以通过顶栏的大脑图标或侧栏"记忆"查看、编辑或删除任何记忆。' },
      { title: '切换模型', icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M3 9h6M3 15h6"/>', text: '您可以通过顶栏的模型选择器或在设置→外观→模型中切换 AI 模型。"fast"模型速度更快，大型模型生成的回复更详细。' },
      { title: '自定义外观', icon: '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>', text: '在设置→外观中，您可以切换主题（自动、深色或浅色），并开启或关闭聊天背景的蜂巢装饰画布。自动主题跟随系统设置。' },
      { title: '管理密钥', icon: '<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>', text: '公钥（pk_...）是通过 Pollinations.ai 使用 AI 的必要凭证。请访问 enter.pollinations.ai 获取。在设置→密钥中，您可以添加多个密钥、激活不同密钥或删除旧密钥。' },
    ];
    body.innerHTML = sections.map(s => `
      <div style="margin-bottom:20px">
        <div style="display:flex;align-items:center;gap:9px;margin-bottom:8px">
          <div style="width:32px;height:32px;background:var(--accent-glow);border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent2)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${s.icon}</svg>
          </div>
          <div style="font-size:14px;font-weight:600;color:var(--text)">${s.title}</div>
        </div>
        <div style="font-size:13px;color:var(--text2);line-height:1.7;padding-left:41px">${s.text}</div>
      </div>`).join('<div style="height:1px;background:var(--border);margin:4px 0 20px"></div>');
  },
  switchTab(tab) {
    state.settingsTab=tab;
    document.getElementById('tab-keys').classList.toggle('active',tab==='keys');
    document.getElementById('tab-appearance').classList.toggle('active',tab==='appearance');
    document.getElementById('tab-model').classList.toggle('active',tab==='model');
    Modals.renderSettings();
  },
  openHtmlPreview(code, lang = 'html') {
    const modal = document.getElementById('html-preview-modal');
    const frame = document.getElementById('html-preview-frame');
    const title = document.getElementById('html-preview-title');
    if (!modal || !frame || !title) return;
    title.textContent = `${String(lang || 'html').toUpperCase()} 预览`;
    frame.srcdoc = code || '<!doctype html><html><body></body></html>';
    modal.classList.add('visible');
  },
  closeHtmlPreview() {
    const modal = document.getElementById('html-preview-modal');
    const frame = document.getElementById('html-preview-frame');
    if (frame) {
      frame.srcdoc = '<!doctype html><html><body></body></html>';
    }
    if (modal) {
      modal.classList.remove('visible');
    }
  }
};
