/* ─── Agents ─────────────────────────────────────────── */
const Agents = {
  config: null,
  currentCategory: 'all',
  searchKeyword: '',
  
  async loadConfig() {
    try {
      const response = await fetch('config/agents.json');
      if (!response.ok) throw new Error('Failed to load agents config');
      this.config = await response.json();
      await this.loadCustomAgents();
      return true;
    } catch (error) {
      console.error('Agents config load error:', error);
      return false;
    }
  },
  
  async loadPrompt(promptFile) {
    if (!promptFile) return null;
    try {
      const response = await fetch(`prompts/agents/${promptFile}`);
      if (!response.ok) throw new Error('Failed to load agent prompt');
      return await response.text();
    } catch (error) {
      console.error('Agent prompt load error:', error);
      return null;
    }
  },
  
  async select(agentId) {
    const agent = this.config?.agents.find(a => a.id === agentId);
    if (!agent) return;
    
    state.currentAgentId = agentId;
    IDBStore.setAgentConfig('currentAgentId', agentId);
    
    let prompt;
    if (agent.isCustom) {
      prompt = agent.prompt;
    } else {
      prompt = await this.loadPrompt(agent.prompt);
    }
    state.agentPrompt = prompt;
    
    UI.showToast(`已切换到${agent.name}`);
  },
  
  getCurrent() {
    if (!this.config || !state.currentAgentId) return null;
    return this.config.agents.find(a => a.id === state.currentAgentId);
  },
  
  async init() {
    const loaded = await this.loadConfig();
    if (!loaded) return;

    const savedAgentId = await IDBStore.getAgentConfig('currentAgentId');
    if (savedAgentId && this.config.agents.find(a => a.id === savedAgentId)) {
      await this.select(savedAgentId);
    } else if (this.config.agents.length > 0) {
      await this.select(this.config.agents[0].id);
    }
  },

  renderCategories() {
    const container = document.getElementById('agents-tabs-container');
    if (!container || !this.config?.categories) return;

    container.innerHTML = this.config.categories.map((cat, index) => `
      <button class="agent-tab ${index === 0 ? 'active' : ''}" data-category="${cat.id}">${cat.name}</button>
    `).join('');

    this.initTabs();
  },

  async renderPlaza() {
    const grid = document.getElementById('agents-grid');
    if (!grid || !this.config?.agents) return;

    this.renderCategories();
    this.renderAgents(this.config.agents);
    this.initSearch();
  },

  renderAgents(agents) {
    const grid = document.getElementById('agents-grid');
    if (!grid) return;

    grid.innerHTML = agents.map(agent => {
      const isCustom = agent.isCustom;
      const avatarHtml = isCustom 
        ? `<div class="card-avatar" style="display:flex;align-items:center;justify-content:center;font-size:32px;background:var(--bg3);border-radius:var(--radius)">${agent.emoji || '🤖'}</div>`
        : `<img src="image/${agent.avatar}" alt="${agent.name}" class="card-avatar" onerror="this.style.display='none'">`;
      
      const badgeHtml = isCustom 
        ? `<span class="custom-agent-badge">自定义</span>` 
        : '';
      
      const deleteBtnHtml = isCustom 
        ? `<button class="agent-delete-btn" onclick="event.stopPropagation();Agents.deleteCustomAgent('${agent.id}')" title="删除智能体">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
               <line x1="18" y1="6" x2="6" y2="18"></line>
               <line x1="6" y1="6" x2="18" y2="18"></line>
             </svg>
           </button>` 
        : '';

      return `
        <div class="agent-card ${isCustom ? 'custom-agent' : ''}" onclick="Agents.useAgent('${agent.id}')">
          ${avatarHtml}
          <div class="card-content">
            <div class="card-name">${agent.name}${badgeHtml}</div>
            <div class="card-desc">${agent.description}</div>
          </div>
          ${deleteBtnHtml}
        </div>
      `;
    }).join('');
  },

  async filterByCategory(categoryId) {
    if (!this.config?.agents) return;

    this.currentCategory = categoryId;

    let agents;
    if (categoryId === 'all') {
      agents = this.config.agents;
    } else if (categoryId === 'mine') {
      const recentIds = await IDBStore.getAgentConfig('recentAgents') || [];
      agents = recentIds
        .map(id => this.config.agents.find(a => a.id === id))
        .filter(Boolean);
    } else {
      agents = this.config.agents.filter(a => a.category === categoryId);
    }

    if (this.searchKeyword) {
      agents = this.searchAgents(agents, this.searchKeyword);
    }

    this.renderAgents(agents);
  },

  searchAgents(agents, keyword) {
    if (!keyword) return agents;
    const lowerKeyword = keyword.toLowerCase();
    return agents.filter(agent => 
      agent.name.toLowerCase().includes(lowerKeyword) ||
      agent.description.toLowerCase().includes(lowerKeyword)
    );
  },

  initSearch() {
    const searchInput = document.getElementById('agents-search-input');
    const clearBtn = document.getElementById('agents-search-clear');
    if (!searchInput) return;

    searchInput.value = this.searchKeyword;
    this.updateClearButton(clearBtn, this.searchKeyword);

    searchInput.addEventListener('input', (e) => {
      this.searchKeyword = e.target.value.trim();
      this.updateClearButton(clearBtn, this.searchKeyword);
      this.filterByCategory(this.currentCategory);
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        this.searchKeyword = '';
        this.updateClearButton(clearBtn, '');
        this.filterByCategory(this.currentCategory);
        searchInput.focus();
      });
    }
  },

  updateClearButton(btn, keyword) {
    if (!btn) return;
    if (keyword) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  },

  initTabs() {
    document.querySelectorAll('.agent-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        document.querySelectorAll('.agent-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        this.filterByCategory(e.target.dataset.category);
      });
    });
  },

  useAgent(agentId) {
    const agent = this.config?.agents.find(a => a.id === agentId);
    if (agent) {
      this.select(agentId);
      this.addToRecent(agentId);
    } else {
      UI.showToast(`已选择智能体：${agentId}`);
    }
    UI.showPage('chat');
  },

  async addToRecent(agentId) {
    let recent = await IDBStore.getAgentConfig('recentAgents') || [];
    recent = recent.filter(id => id !== agentId);
    recent.unshift(agentId);
    recent = recent.slice(0, 10);
    IDBStore.setAgentConfig('recentAgents', recent);
  },

  commonEmojis: ['🤖', '👨‍💻', '👩‍💻', '🎨', '📝', '📚', '💡', '🔧', '🎯', '🚀', '💼', '🎓', '✨', '🌟', '💪', '🧠', '💻', '🔬', '📊', '🎵', '🎮', '📱', '🌈', '🔥', '⚡', '🦾', '🤝', '🎯', '💎', '🏆'],
  selectedEmoji: '🤖',

  openCreateModal() {
    this.selectedEmoji = '🤖';
    this.renderCreateForm();
    document.getElementById('create-agent-modal').classList.add('visible');
  },

  renderCreateForm() {
    const body = document.getElementById('create-agent-body');
    if (!body) return;

    const categories = this.config?.categories?.filter(c => c.id !== 'all' && c.id !== 'mine') || [];

    body.innerHTML = `
      <div class="form-group">
        <label class="form-label">智能体名称 <span class="required">*</span></label>
        <input type="text" class="form-input" id="agent-name-input" 
               placeholder="例如：代码审查助手" maxlength="20">
        <div class="form-hint">最多20个字符</div>
      </div>

      <div class="form-group">
        <label class="form-label">Emoji头像</label>
        <div class="emoji-picker-container">
          <div class="emoji-display" id="emoji-display" onclick="Agents.toggleEmojiGrid()">
            ${this.selectedEmoji}
          </div>
          <input type="text" class="emoji-input" id="emoji-input" 
                 placeholder="或输入任意emoji" maxlength="2"
                 oninput="Agents.handleEmojiInput(this.value)">
        </div>
        <div class="emoji-grid" id="emoji-grid" style="display: none;">
          ${this.commonEmojis.map(emoji => `
            <button class="emoji-item ${emoji === this.selectedEmoji ? 'selected' : ''}" 
                    onclick="Agents.selectEmoji('${emoji}')">${emoji}</button>
          `).join('')}
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">分类</label>
        <select class="category-select" id="agent-category-select">
          <option value="work">工作</option>
          <option value="study">学习</option>
          <option value="create">创作</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">描述</label>
        <input type="text" class="form-input" id="agent-desc-input" 
               placeholder="简短描述这个智能体的用途" maxlength="100">
        <div class="form-hint">最多100个字符（可选）</div>
      </div>

      <div class="form-group">
        <label class="form-label">角色定义 <span class="required">*</span></label>
        <textarea class="form-textarea" id="agent-prompt-input" 
                  placeholder="定义这个智能体的角色、能力和行为方式。例如：&#10;你是一个专业的代码审查助手，擅长发现代码中的潜在问题并提供改进建议。你的回答应该：&#10;1. 简洁明了，直击要点&#10;2. 提供具体的代码示例&#10;3. 解释为什么这是个问题以及如何改进"
                  maxlength="2000"></textarea>
        <div class="form-hint">详细描述智能体的角色和行为方式（10-2000字符）</div>
      </div>
    `;
  },

  toggleEmojiGrid() {
    const grid = document.getElementById('emoji-grid');
    if (grid) {
      const isHidden = grid.style.display === 'none';
      grid.style.display = isHidden ? 'grid' : 'none';
      
      if (isHidden) {
        setTimeout(() => {
          document.addEventListener('click', this.handleEmojiGridClickOutside);
        }, 0);
      } else {
        document.removeEventListener('click', this.handleEmojiGridClickOutside);
      }
    }
  },

  handleEmojiGridClickOutside(e) {
    const grid = document.getElementById('emoji-grid');
    const display = document.getElementById('emoji-display');
    const input = document.getElementById('emoji-input');
    
    if (grid && !grid.contains(e.target) && e.target !== display && !display?.contains(e.target) && e.target !== input) {
      grid.style.display = 'none';
      document.removeEventListener('click', Agents.handleEmojiGridClickOutside);
    }
  },

  selectEmoji(emoji) {
    this.selectedEmoji = emoji;
    const display = document.getElementById('emoji-display');
    const input = document.getElementById('emoji-input');
    const grid = document.getElementById('emoji-grid');
    
    if (display) display.textContent = emoji;
    if (input) input.value = emoji;
    if (grid) {
      grid.style.display = 'none';
      document.removeEventListener('click', this.handleEmojiGridClickOutside);
    }

    document.querySelectorAll('.emoji-item').forEach(item => {
      item.classList.toggle('selected', item.textContent === emoji);
    });
  },

  handleEmojiInput(value) {
    if (value && value.trim()) {
      this.selectedEmoji = value.trim();
      const display = document.getElementById('emoji-display');
      if (display) display.textContent = this.selectedEmoji;
      
      document.querySelectorAll('.emoji-item').forEach(item => {
        item.classList.toggle('selected', item.textContent === this.selectedEmoji);
      });
    }
  },

  async createAgent() {
    const nameInput = document.getElementById('agent-name-input');
    const descInput = document.getElementById('agent-desc-input');
    const promptInput = document.getElementById('agent-prompt-input');
    const categorySelect = document.getElementById('agent-category-select');

    const name = nameInput?.value.trim();
    const description = descInput?.value.trim();
    const prompt = promptInput?.value.trim();
    const category = categorySelect?.value || 'work';

    if (!name || name.length < 1 || name.length > 20) {
      UI.showToast('请输入1-20个字符的智能体名称');
      nameInput?.focus();
      return;
    }

    if (!prompt || prompt.length < 10 || prompt.length > 2000) {
      UI.showToast('请输入10-2000个字符的角色定义');
      promptInput?.focus();
      return;
    }

    const agent = {
      id: 'custom_' + Date.now(),
      name: name,
      emoji: this.selectedEmoji,
      avatar: null,
      prompt: prompt,
      description: description || '自定义智能体',
      category: category,
      isCustom: true
    };

    try {
      let customAgents = await IDBStore.getAgentConfig('customAgents') || [];
      customAgents.push(agent);
      await IDBStore.setAgentConfig('customAgents', customAgents);

      if (this.config && this.config.agents) {
        this.config.agents.push(agent);
      }

      UI.closeModal('create-agent-modal');
      UI.showToast(`智能体"${name}"创建成功！`);
      
      await this.renderPlaza();
    } catch (error) {
      console.error('创建智能体失败:', error);
      UI.showToast('创建失败，请重试');
    }
  },

  async loadCustomAgents() {
    try {
      const customAgents = await IDBStore.getAgentConfig('customAgents') || [];
      if (this.config && this.config.agents) {
        const existingIds = new Set(this.config.agents.map(a => a.id));
        customAgents.forEach(agent => {
          if (!existingIds.has(agent.id)) {
            this.config.agents.push(agent);
          }
        });
      }
    } catch (error) {
      console.error('加载自定义智能体失败:', error);
    }
  },

  async deleteCustomAgent(agentId) {
    try {
      let customAgents = await IDBStore.getAgentConfig('customAgents') || [];
      customAgents = customAgents.filter(a => a.id !== agentId);
      await IDBStore.setAgentConfig('customAgents', customAgents);

      if (this.config && this.config.agents) {
        this.config.agents = this.config.agents.filter(a => a.id !== agentId);
      }

      UI.showToast('智能体已删除');
      await this.renderPlaza();
    } catch (error) {
      console.error('删除智能体失败:', error);
      UI.showToast('删除失败，请重试');
    }
  }
};
