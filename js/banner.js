/* ─── Banner ─────────────────────────────────────────── */
const Banner = {
  config: null,
  
  async loadConfig() {
    try {
      const response = await fetch('config/banner.json');
      if (!response.ok) throw new Error('Failed to load banner config');
      this.config = await response.json();
      return true;
    } catch (error) {
      console.error('Banner config load error:', error);
      return false;
    }
  },
  
  async loadPrompt(promptFile) {
    if (!promptFile) return null;
    try {
      const response = await fetch(`prompts/banner/${promptFile}`);
      if (!response.ok) throw new Error('Failed to load prompt');
      return await response.text();
    } catch (error) {
      console.error('Prompt load error:', error);
      return null;
    }
  },
  
  renderActions() {
    const inputActions = document.querySelector('.input-actions');
    if (!inputActions || !this.config) return;
    
    const spacer = inputActions.querySelector('.spacer');
    if (!spacer) return;
    
    const actions = this.config.actions || [];
    
    if (actions.length <= 3) {
      actions.forEach(action => {
        inputActions.insertBefore(this.createActionButton(action), spacer);
      });
    } else {
      actions.slice(0, 2).forEach(action => {
        inputActions.insertBefore(this.createActionButton(action), spacer);
      });
      inputActions.insertBefore(this.createMoreDropdown(actions.slice(2)), spacer);
    }
  },
  
  createActionButton(action) {
    const btn = document.createElement('button');
    btn.className = 'action-btn';
    btn.title = action.name;
    btn.setAttribute('data-action', action.id);
    
    btn.innerHTML = `
      ${action.iconSvg}
      <span>${action.name}</span>
    `;
    
    btn.addEventListener('click', () => this.handleAction(action));
    
    return btn;
  },
  
  createMoreDropdown(actions) {
    const wrapper = document.createElement('div');
    wrapper.className = 'dropdown-wrapper more-dropdown-wrapper';
    
    const btn = document.createElement('button');
    btn.className = 'action-btn';
    btn.title = '更多';
    btn.id = 'moreBtn';
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/>
        <rect x="15" y="3" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/>
        <rect x="3" y="15" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/>
        <rect x="15" y="15" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/>
      </svg>
      <span>更多</span>
    `;
    
    const menu = document.createElement('div');
    menu.className = 'dropdown-menu more-menu';
    menu.id = 'moreMenu';
    
    actions.forEach(action => {
      const item = document.createElement('div');
      item.className = 'dropdown-item';
      item.setAttribute('data-action', action.id);
      
      item.innerHTML = `
        <div class="dropdown-item-header">
          ${action.iconSvg}
          <span>${action.name}</span>
        </div>
      `;
      
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleAction(action);
        UI.closeAllDropdowns();
      });
      
      menu.appendChild(item);
    });
    
    wrapper.appendChild(btn);
    wrapper.appendChild(menu);
    
    return wrapper;
  },
  
  async handleAction(action) {
    const input = document.getElementById('msg-input');
    if (!input) return;
    
    const prompt = await this.loadPrompt(action.prompt);
    if (prompt) {
      state.currentBannerMode = action.id;
      state.bannerPrompt = prompt;
      input.placeholder = `在${action.name}模式下发消息...`;
      UI.showToast(`已切换到${action.name}模式`);
    }
  }
};
