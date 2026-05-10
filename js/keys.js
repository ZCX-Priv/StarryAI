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
  setModel(id) { state.model=id; Store.saveConfig('model', id); UI.renderModelPill(); UI.updateThinkingModeVisibility(); Modals.renderSettings(); },
  setModelAndUpdate(id) { state.model=id; Store.saveConfig('model', id); UI.renderModelPill(); UI.updateThinkingModeVisibility(); Chat.handleModelChange(); Account.invalidate(); Modals.renderModelPicker(); },
  async _loadModels() {
    try {
      const r = await fetch('https://gen.pollinations.ai/models');
      if (r.ok) {
        const data = await r.json();
        const models = data
          .filter(m => m.input_modalities && m.input_modalities.includes('text'))
          .filter(m => m.output_modalities && m.output_modalities.includes('text'))
          .filter(m => m.aliases && m.aliases.length > 0)
          .map(m => ({
            id: m.name,
            label: m.aliases[0],
            pollen: m.pricing ? parseFloat(m.pricing.completionTextTokens) : null,
            paidOnly: m.paid_only || false,
            reasoning: m.reasoning || false,
            contextLength: m.context_length || null
          }));
        if (models.length > 0) {
          state.models = models;
          if (!state.models.find(m => m.id === state.model)) {
            state.model = state.models[0]?.id || 'openai';
            Store.saveConfig('model', state.model);
          }
        }
      }
    } catch {}
    if (!state.model) {
      state.model = state.models[0]?.id || 'openai';
    }
    UI.renderModelPill();
    UI.updateThinkingModeVisibility();
  }
};
