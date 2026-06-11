import { API_BASE } from '@/lib/config';
import useAppStore from '@/store/useAppStore';

function _normalizeReasoningValue(value, trimStrings = true) {
  if (!value) return '';
  if (typeof value === 'string') return trimStrings ? value.trim() : value;
  if (Array.isArray(value)) {
    const merged = value.map(item => _normalizeReasoningValue(item, trimStrings)).filter(Boolean).join('\n');
    return trimStrings ? merged.trim() : merged;
  }
  if (typeof value === 'object') {
    const candidates = [value.text, value.content, value.reasoning, value.reasoning_content, value.summary];
    const normalized = candidates.map(item => _normalizeReasoningValue(item, trimStrings)).filter(Boolean).join('\n');
    return trimStrings ? normalized.trim() : normalized;
  }
  return '';
}

function _extractReasoning(source, trimStrings = true) {
  if (!source || typeof source !== 'object') return '';
  return _normalizeReasoningValue(source.reasoning_content ?? source.reasoning ?? source.reasoning_details, trimStrings);
}

function _mergeReasoningAndContent(reasoning, content) {
  const nr = _normalizeReasoningValue(reasoning);
  const nc = typeof content === 'string' ? content : '';
  if (!nr) return nc || null;
  if (nc.includes('</think')) return nc;
  return `<think/>\n${nr}\n</think/>\n${nc ? `\n${nc}` : ''}`;
}

function _buildParams(msgs, model, stream) {
  const state = useAppStore.getState();
  const baseParams = {
    model: model || state.model,
    messages: msgs,
    stream,
    seed: Math.floor(Math.random() * 2147483647),
    temperature: state.temperature,
    top_p: state.topP,
  };
  const modeConfig = state.modeConfig[state.currentMode] || {};
  return { ...baseParams, ...modeConfig };
}

async function fetchAPI(msgs, model) {
  const state = useAppStore.getState();
  const r = await fetch(`${API_BASE}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${state.activeKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(_buildParams(msgs, model, false)),
  });
  if (r.status === 401 || r.status === 403) return null;
  if (!r.ok) {
    let msg = `HTTP ${r.status}`;
    try { const e = await r.json(); msg = e?.error?.message || msg; } catch {}
    throw new Error(msg);
  }
  const d = await r.json();
  const message = d.choices?.[0]?.message;
  return _mergeReasoningAndContent(_extractReasoning(message, true), message?.content);
}

async function* streamAPI(msgs, model) {
  const state = useAppStore.getState();
  const r = await fetch(`${API_BASE}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${state.activeKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(_buildParams(msgs, model, true)),
  });
  if (r.status === 401 || r.status === 403) return;
  if (!r.ok) {
    let msg = `HTTP ${r.status}`;
    try { const e = await r.json(); msg = e?.error?.message || msg; } catch {}
    throw new Error(msg);
  }
  if (!r.body) {
    const txt = await r.text();
    try {
      const d = JSON.parse(txt);
      const message = d.choices?.[0]?.message;
      const merged = _mergeReasoningAndContent(_extractReasoning(message, true), message?.content);
      if (merged) yield merged;
    } catch {}
    return;
  }
  const reader = r.body.getReader(), dec = new TextDecoder();
  let buf = '';
  let inThinking = false;
  while (true) {
    if (useAppStore.getState().stopRequested) { try { reader.cancel(); } catch {} return; }
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split('\n'); buf = lines.pop();
    for (const line of lines) {
      if (useAppStore.getState().stopRequested) return;
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') {
        if (inThinking) yield '</think/>';
        return;
      }
      try {
        const p = JSON.parse(data);
        const delta = p.choices?.[0]?.delta;
        const reasoning = _extractReasoning(delta, false);
        const content = delta?.content;
        if (reasoning) {
          if (!inThinking) { yield '<think/>'; inThinking = true; }
          yield reasoning;
        }
        if (content) {
          if (inThinking && !content.includes('</think/>')) { yield '</think/>'; inThinking = false; }
          yield content;
          if (content.includes('</think/>')) { inThinking = false; }
          else if (content.includes('<think/>')) { inThinking = true; }
        }
      } catch {}
    }
  }
  if (inThinking) yield '</think/>';
}

async function validateKey(key) {
  key = key.trim();
  if (!/^(pk_|sk_)[A-Za-z0-9]{8,}$/.test(key)) return false;
  try {
    const r = await fetch(`${API_BASE}/text/hello?key=${encodeURIComponent(key)}`);
    if (r.status === 401) return false;
    return true;
  } catch { return true; }
}

async function loadModels() {
  try {
    const r = await fetch(`${API_BASE}/models`);
    if (r.ok) {
      const data = await r.json();
      const models = data
        .filter(m => m.input_modalities?.includes('text') && m.output_modalities?.includes('text') && m.aliases?.length > 0)
        .map(m => ({
          id: m.name,
          label: m.aliases[0],
          pollen: m.pricing ? parseFloat(m.pricing.completionTextTokens) : null,
          paidOnly: m.paid_only || false,
          reasoning: m.reasoning || false,
          contextLength: m.context_length || null,
        }));
      if (models.length > 0) return models;
    }
  } catch {}
  return null;
}

export const API = {
  fetch: fetchAPI,
  stream: streamAPI,
  validateKey,
  loadModels,
  buildParams: _buildParams,
};
