/* ─── Agents ─────────────────────────────────────────── */
const Agents = {
  config: null,
  currentCategory: 'all',
  
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
    localStorage.setItem('pollen_agent', agentId);
    
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

    const savedAgentId = localStorage.getItem('pollen_agent');
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

  renderPlaza() {
    const grid = document.getElementById('agents-grid');
    if (!grid || !this.config?.agents) return;

    this.renderCategories();
    this.renderAgents(this.config.agents);
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

  filterByCategory(categoryId) {
    if (!this.config?.agents) return;

    this.currentCategory = categoryId;

    if (categoryId === 'all') {
      this.renderAgents(this.config.agents);
    } else if (categoryId === 'mine') {
      const recentIds = JSON.parse(localStorage.getItem('pollen_recent_agents') || '[]');
      const mineAgents = recentIds
        .map(id => this.config.agents.find(a => a.id === id))
        .filter(Boolean);
      this.renderAgents(mineAgents);
    } else {
      const filtered = this.config.agents.filter(a => a.category === categoryId);
      this.renderAgents(filtered);
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

  addToRecent(agentId) {
    let recent = JSON.parse(localStorage.getItem('pollen_recent_agents') || '[]');
    recent = recent.filter(id => id !== agentId);
    recent.unshift(agentId);
    recent = recent.slice(0, 10);
    localStorage.setItem('pollen_recent_agents', JSON.stringify(recent));
  }
};
