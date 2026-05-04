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
    
    const prompt = await this.loadPrompt(agent.prompt);
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

    grid.innerHTML = agents.map(agent => `
      <div class="agent-card" onclick="Agents.useAgent('${agent.id}')">
        <img src="image/${agent.avatar}" alt="${agent.name}" class="card-avatar"
             onerror="this.style.display='none'">
        <div class="card-content">
          <div class="card-name">${agent.name}</div>
          <div class="card-desc">${agent.description}</div>
        </div>
      </div>
    `).join('');
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
  }
};
