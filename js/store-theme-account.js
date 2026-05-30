/* ─── 存储 ─────────────────────────────────────────── */
const Store = {
  _useIDB: true,

  async saveChats() {
    if (!this._useIDB) {
      this._saveChatsLS();
      return;
    }
    
    try {
      const results = await Promise.allSettled(
        state.chats.map(chat => IDBStore.saveChat(chat))
      );
      results.forEach((r, i) => {
        if (r.status === 'rejected') {
          console.error(`聊天 ${state.chats[i]?.id} 保存失败:`, r.reason);
        }
      });
    } catch (error) {
      console.error('saveChats 失败，降级到 localStorage:', error);
      this._saveChatsLS();
    }
  },

  _saveChatsLS() {
    try {
      localStorage.setItem(KEYS.KEYS_MAP.CHATS, JSON.stringify(state.chats));
    } catch (e) {
      console.error('localStorage 保存 chats 失败:', e);
    }
  },

  async saveChat(chatId) {
    const chat = state.chats.find(c => c.id === chatId);
    if (!chat) return;
    
    if (!this._useIDB) {
      this._saveChatsLS();
      return;
    }
    
    try {
      await IDBStore.saveChat(chat);
    } catch (error) {
      console.error(`saveChat ${chatId} 失败:`, error);
    }
  },

  async saveMemory() {
    if (!this._useIDB) {
      this._saveMemoryLS();
      return;
    }
    
    try {
      await IDBStore.setMemory(state.memory);
    } catch (error) {
      console.error('saveMemory 失败，降级到 localStorage:', error);
      this._saveMemoryLS();
    }
  },

  _saveMemoryLS() {
    try {
      localStorage.setItem(KEYS.KEYS_MAP.MEMORY, JSON.stringify(state.memory));
    } catch (e) {
      console.error('localStorage 保存 memory 失败:', e);
    }
  },

  async saveKeys() {
    if (!this._useIDB) {
      this._saveKeysLS();
      return;
    }
    
    try {
      await IDBStore.setKeys(state.keys);
    } catch (error) {
      console.error('saveKeys 失败，降级到 localStorage:', error);
      this._saveKeysLS();
    }
  },

  _saveKeysLS() {
    try {
      localStorage.setItem(KEYS.KEYS_MAP.KEYS, JSON.stringify(state.keys));
    } catch (e) {
      console.error('localStorage 保存 keys 失败:', e);
    }
  },

  async saveActiveKey(key) {
    if (!this._useIDB) {
      localStorage.setItem(KEYS.KEYS_MAP.ACTIVE_KEY, key || '');
      return;
    }
    
    try {
      await IDBStore.setActiveKey(key);
    } catch (error) {
      console.error('saveActiveKey 失败:', error);
      localStorage.setItem(KEYS.KEYS_MAP.ACTIVE_KEY, key || '');
    }
  },

  async saveConfig(key, value) {
    if (!this._useIDB) {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
      return;
    }
    
    try {
      await IDBStore.setConfig(key, value);
    } catch (error) {
      console.error(`saveConfig ${key} 失败:`, error);
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    }
  },

  async loadChats() {
    if (!this._useIDB) {
      return this._loadLS(KEYS.KEYS_MAP.CHATS, []);
    }
    
    try {
      const chats = await IDBStore.getAllChats();
      return chats.length > 0 ? chats : this._loadLS(KEYS.KEYS_MAP.CHATS, []);
    } catch (error) {
      console.error('loadChats 失败，降级到 localStorage:', error);
      return this._loadLS(KEYS.KEYS_MAP.CHATS, []);
    }
  },

  async loadMemory() {
    if (!this._useIDB) {
      return this._loadLS(KEYS.KEYS_MAP.MEMORY, []);
    }
    
    try {
      const memory = await IDBStore.getMemory();
      return memory.length > 0 ? memory : this._loadLS(KEYS.KEYS_MAP.MEMORY, []);
    } catch (error) {
      console.error('loadMemory 失败，降级到 localStorage:', error);
      return this._loadLS(KEYS.KEYS_MAP.MEMORY, []);
    }
  },

  async loadKeys() {
    if (!this._useIDB) {
      return this._loadLS(KEYS.KEYS_MAP.KEYS, []);
    }
    
    try {
      const keys = await IDBStore.getKeys();
      return keys.length > 0 ? keys : this._loadLS(KEYS.KEYS_MAP.KEYS, []);
    } catch (error) {
      console.error('loadKeys 失败，降级到 localStorage:', error);
      return this._loadLS(KEYS.KEYS_MAP.KEYS, []);
    }
  },

  async loadActiveKey() {
    if (!this._useIDB) {
      return localStorage.getItem(KEYS.KEYS_MAP.ACTIVE_KEY) || null;
    }
    
    try {
      const key = await IDBStore.getActiveKey();
      return key !== null ? key : localStorage.getItem(KEYS.KEYS_MAP.ACTIVE_KEY);
    } catch (error) {
      console.error('loadActiveKey 失败:', error);
      return localStorage.getItem(KEYS.KEYS_MAP.ACTIVE_KEY);
    }
  },

  async loadConfig(key, fallback = null) {
    if (!this._useIDB) {
      return localStorage.getItem(key) || fallback;
    }
    
    try {
      const value = await IDBStore.getConfig(key);
      return value !== null ? value : localStorage.getItem(key) || fallback;
    } catch (error) {
      console.error(`loadConfig ${key} 失败:`, error);
      return localStorage.getItem(key) || fallback;
    }
  },

  async deleteChat(chatId) {
    if (!this._useIDB) {
      this._saveChatsLS();
      return;
    }
    
    try {
      await IDBStore.deleteChat(chatId);
    } catch (error) {
      console.error(`deleteChat ${chatId} 失败:`, error);
    }
  },

  _loadLS(key, fallback = []) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  },

  save(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  },

  load(key, fallback = []) {
    try {
      return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
    } catch {
      return fallback;
    }
  }
};

/* ─── 主题 ─────────────────────────────────────────── */
const Theme = {
  apply(theme) {
    state.theme = theme;
    const dark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    const moon = document.getElementById('icon-moon'), sun = document.getElementById('icon-sun');
    if (moon) moon.style.display = dark ? 'none'  : 'block';
    if (sun)  sun.style.display  = dark ? 'block' : 'none';
    Store.saveConfig('theme', theme);
    requestAnimationFrame(() => { if (typeof drawChatHoneycomb === 'function') drawChatHoneycomb(); });
  },
  toggle() {
    Theme.apply(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  }
};
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (state.theme === 'auto') Theme.apply('auto');
});

/* ─── 账户 ───────────────────────────────────────── */
const Account = {
  _cache: null, _cacheTs: 0,

  getCost(modelId) {
    if (!modelId) return null;
    const m = state.models.find(m => m.id === modelId);
    if (m && m.pollen !== null && m.pollen !== undefined) return m.pollen;
    return null;
  },

  async fetch() {
    if (!state.activeKey) return null;
    const now = Date.now();
    if (this._cache && (now - this._cacheTs) < 30000) return this._cache;
    try {
      const headers = { 'Authorization': `Bearer ${state.activeKey}` };
      const [balRes, profRes, keyRes] = await Promise.allSettled([
        fetch(`${API_BASE}/account/balance`, { headers }),
        fetch(`${API_BASE}/account/profile`, { headers }),
        fetch(`${API_BASE}/account/key`,     { headers })
      ]);
      const bal  = balRes.status  === 'fulfilled' && balRes.value.ok  ? await balRes.value.json()  : null;
      const prof = profRes.status === 'fulfilled' && profRes.value.ok ? await profRes.value.json() : null;
      const key  = keyRes.status  === 'fulfilled' && keyRes.value.ok  ? await keyRes.value.json()  : null;

      const balance     = bal?.balance     ?? bal?.pollen      ?? bal?.total        ?? null;
      const tierBalance = bal?.tierBalance ?? bal?.tier_balance ?? bal?.dailyBalance ?? null;
      const packBalance = bal?.packBalance ?? bal?.pack_balance ?? bal?.purchased    ?? null;
      const tier        = prof?.tier       ?? bal?.tier         ?? key?.tier         ?? null;
      const nextResetAt = prof?.nextResetAt ?? bal?.nextResetAt ?? prof?.next_reset  ?? bal?.next_reset ?? null;
      const keyType     = key?.type        ?? (state.activeKey?.startsWith('sk_') ? 'secret' : 'publishable');
      const permissions = key?.permissions ?? key?.scopes ?? null;

      this._cache = { balance, tierBalance, packBalance, tier, nextResetAt, keyType, permissions };
      this._cacheTs = now;
      return this._cache;
    } catch { return null; }
  },

  invalidate() { this._cache = null; },

  fmt(val) {
    if (val === null || val === undefined) return '—';
    const n = Number(val);
    if (n === 0) return '0';
    if (n >= 1000) return n.toLocaleString(state.lang, { maximumFractionDigits: 0 });
    if (n >= 1)    return n.toLocaleString(state.lang, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    return n.toLocaleString(state.lang, { minimumFractionDigits: 0, maximumFractionDigits: 4 });
  }
};
