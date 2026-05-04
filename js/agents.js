/* ─── Agents ─────────────────────────────────────────── */
const Agents = {
  config: null,
  
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

  renderPlaza() {
    const grid = document.getElementById('agents-grid');
    if (!grid) return;

    const plazaAgents = [
      {
        id: 'writer-assistant',
        name: '全能写作助手',
        avatar: 'agents/writer.png',
        description: '提供多种文案创作选择，轻松完成各种文案任务。',
        usage: '1347.6万',
        author: '豆包官方',
        category: 'work'
      },
      {
        id: 'image-prompt',
        name: '识图生成提示词',
        avatar: 'agents/assistant.png',
        description: '上传图片，根据图片内容精准生成提示词，帮助您更好地描述图像。',
        usage: '106万',
        author: '豆包识图',
        category: 'create'
      },
      {
        id: 'english-polish',
        name: '英文写作润色',
        avatar: 'agents/writer.png',
        description: 'An assistant dedicated to polishing English writing, improving grammar and style.',
        usage: '34.6万',
        author: '豆包官方',
        category: 'study'
      },
      {
        id: 'emotional-reply',
        name: '高情商回复',
        avatar: 'agents/assistant.png',
        description: '聊天时不知道怎么回复，我来帮你~ 提供温暖贴心的回复建议。',
        usage: '1265.2万',
        author: '文比斯之梦',
        category: 'life'
      },
      {
        id: 'translator',
        name: '中英翻译',
        avatar: 'agents/coder.png',
        description: '专业翻译助手，精准转换中文内容，专注翻译不同场景的文本。',
        usage: '303.1万',
        author: 'Deja Le',
        category: 'work'
      },
      {
        id: 'excel-master',
        name: 'EXCEL大全',
        avatar: 'agents/assistant.png',
        description: '拥有卓越数据处理能力，助您解决 Excel 各类难题，提升工作效率。',
        usage: '22万',
        author: '春风十里oh~',
        category: 'work'
      },
      {
        id: 'thesis-helper',
        name: '论文助手',
        avatar: 'agents/writer.png',
        description: '能助力用户完成严谨详实论文的专业帮手，提供写作指导和修改建议。',
        usage: '44.8万',
        author: '欧阳困困',
        category: 'study'
      },
      {
        id: 'copywriter',
        name: '爆款文案',
        avatar: 'agents/assistant.png',
        description: '知名博主，善写爆款文案，精通电商带货、粉丝互动等场景。',
        usage: '80.1万',
        author: '如顺',
        category: 'create'
      },
      {
        id: 'python-coder',
        name: 'python编程',
        avatar: 'agents/coder.png',
        description: '能助您精通 Python 编程，涵盖知识全面的专业助手，从入门到精通。',
        usage: '26.6万',
        author: '老陆',
        category: 'study'
      },
      {
        id: 'official-writing',
        name: '公文写作',
        avatar: 'agents/writer.png',
        description: '一个神秘的智能体，擅长各类公文写作，格式规范，用词准确。',
        usage: '10.7万',
        author: '多唐',
        category: 'work'
      },
      {
        id: 'ai-expansion',
        name: 'AI扩文',
        avatar: 'agents/assistant.png',
        description: '能将简短语句扩展为丰富长文，助您丰富表达内容，提升文章质量。',
        usage: '24.8万',
        author: '蓝蓝的春天',
        category: 'create'
      },
      {
        id: 'douyin-copywriter',
        name: '抖音文案',
        avatar: 'agents/writer.png',
        description: '能创作多样风格抖音文案，适配各种主题场景，吸引眼球。',
        usage: '20.8万',
        author: '红宝',
        category: 'create'
      },
      {
        id: 'ocr-text',
        name: '识图转文字',
        avatar: 'agents/assistant.png',
        description: '图片上的文字不能复制？立即上传图片，帮你精准识别并转换为可编辑文本。',
        usage: '',
        author: '',
        category: 'work'
      },
      {
        id: 'mind-map',
        name: '思维导图',
        avatar: 'agents/coder.png',
        description: '根据一句话即可生成思维导图，帮助您整理思路，清晰呈现想法。',
        usage: '',
        author: '',
        category: 'study'
      }
    ];

    grid.innerHTML = plazaAgents.map(agent => `
      <div class="agent-card" onclick="Agents.useAgent('${agent.id}')">
        <img src="image/${agent.avatar}" alt="${agent.name}" class="card-avatar"
             onerror="this.style.display='none'">
        <div class="card-content">
          <div class="card-name">${agent.name}</div>
          <div class="card-desc">${agent.description}</div>
          <div class="card-meta">
            ${agent.usage ? `<span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
              </svg>
              ${agent.usage}人聊过
            </span>` : ''}
            ${agent.author ? `<span>@${agent.author}</span>` : ''}
          </div>
        </div>
      </div>
    `).join('');

    this.initTabs();
  },

  initTabs() {
    document.querySelectorAll('.agent-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        document.querySelectorAll('.agent-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
      });
    });
  },

  useAgent(agentId) {
    const agent = this.config?.agents.find(a => a.id === agentId);
    if (agent) {
      this.select(agentId);
    } else {
      UI.showToast(`已选择智能体：${agentId}`);
    }
    UI.showPage('chat');
  }
};
