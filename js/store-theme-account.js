/* ─── Store ─────────────────────────────────────────── */
const Store = {
  save(key, val) { localStorage.setItem(key, JSON.stringify(val)); },
  load(key, fallback = []) {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
  },
  saveChats()  { Store.save(KEYS.KEYS_MAP.CHATS,  state.chats);  },
  saveMemory() { Store.save(KEYS.KEYS_MAP.MEMORY, state.memory); },
  saveKeys()   { Store.save(KEYS.KEYS_MAP.KEYS,   state.keys);   },
};

/* ─── Theme ─────────────────────────────────────────── */
const Theme = {
  apply(theme) {
    state.theme = theme;
    const dark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    const moon = document.getElementById('icon-moon'), sun = document.getElementById('icon-sun');
    if (moon) moon.style.display = dark ? 'none'  : 'block';
    if (sun)  sun.style.display  = dark ? 'block' : 'none';
    localStorage.setItem(KEYS.KEYS_MAP.THEME, theme);
    requestAnimationFrame(() => { if (typeof drawChatHoneycomb === 'function') drawChatHoneycomb(); });
  },
  toggle() {
    Theme.apply(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  }
};
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (state.theme === 'auto') Theme.apply('auto');
});

/* ─── Account ───────────────────────────────────────── */
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
      // NOTE: Content-Type must NOT be sent on GET requests — it triggers a CORS preflight
      // that the Pollinations API rejects, causing all three calls to fail silently.
      const headers = { 'Authorization': `Bearer ${state.activeKey}` };
      const [balRes, profRes, keyRes] = await Promise.allSettled([
        fetch(`${API_BASE}/account/balance`, { headers }),
        fetch(`${API_BASE}/account/profile`, { headers }),
        fetch(`${API_BASE}/account/key`,     { headers })
      ]);
      const bal  = balRes.status  === 'fulfilled' && balRes.value.ok  ? await balRes.value.json()  : null;
      const prof = profRes.status === 'fulfilled' && profRes.value.ok ? await profRes.value.json() : null;
      const key  = keyRes.status  === 'fulfilled' && keyRes.value.ok  ? await keyRes.value.json()  : null;

      // Field names vary across API versions — use broad fallback chains
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
