/* ─── Keys ──────────────────────────────────────────── */
const Keys = {
  activate(key) { state.activeKey=key; Store.saveActiveKey(key); Modals.renderSettings(); UI.showToast('密钥已保存！'); },
  async add() {
    const inp=document.getElementById('new-key-input');
    const key=inp.value.trim(); if (!key) return;
    if (!state.keys.includes(key)) { state.keys.push(key); Store.saveKeys(); }
    inp.value=''; Modals.renderSettings(); UI.showToast('密钥已保存！');
  },
  delete(key) {
    state.keys=state.keys.filter(k=>k!==key);
    if (state.activeKey===key) { state.activeKey=state.keys[0]||null; Store.saveActiveKey(state.activeKey||''); }
    Store.saveKeys(); Modals.renderSettings(); UI.showToast('密钥已删除');
  },
  setModel(id) { state.model=id; Store.saveConfig('model', id); UI.renderModelPill(); Modals.renderSettings(); },
  setModelAndUpdate(id) { state.model=id; Store.saveConfig('model', id); UI.renderModelPill(); Account.invalidate(); Modals.renderModelPicker(); },
  async _loadModels() {
    try {
      const headers = state.activeKey ? {'Authorization':`Bearer ${state.activeKey}`} : {};
      const r = await fetch(`${API_BASE}/v1/models`, {headers});
      if (r.ok) {
        const data = await r.json();
        const exclKeywords = [
          'flux','image','gptimage','tts','whisper','audio','video',
          'speech','scribe','music','veo','seedance','wan','ltx',
          'nanobanana','kontext','seedream','grok-video','grok-imagine',
          'imagen','klein','zimage','elevenlabs'
        ];
        const models = (data.data || [])
          .filter(m => !exclKeywords.some(kw => m.id.toLowerCase().includes(kw)))
          .map(m => ({
            id: m.id,
            label: m.id,
            pollen: (m.pollen !== undefined && m.pollen !== null) ? Number(m.pollen)
                  : (m.cost   !== undefined && m.cost   !== null) ? Number(m.cost)
                  : null
          }));
        if (models.length > 0) {
          state.models = models;
          if (!state.models.find(m => m.id === state.model)) {
            state.model = state.models[0]?.id || 'nova-fast';
            Store.saveConfig('model', state.model);
          }
        }
      }
    } catch {}
    if (!state.model) {
      state.model = state.models[0]?.id || 'nova-fast';
    }
    UI.renderModelPill();
  }
};
