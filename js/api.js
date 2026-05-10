/* ─── API ────────────────────────────────────────────── */
const API = {
  _normalizeReasoningValue(value, trimStrings = true) {
    if (!value) return '';
    if (typeof value === 'string') {
      return trimStrings ? value.trim() : value;
    }
    if (Array.isArray(value)) {
      const merged = value
        .map(item => API._normalizeReasoningValue(item, trimStrings))
        .filter(Boolean)
        .join('\n');
      return trimStrings ? merged.trim() : merged;
    }
    if (typeof value === 'object') {
      const candidates = [
        value.text,
        value.content,
        value.reasoning,
        value.reasoning_content,
        value.summary
      ];
      const normalized = candidates
        .map(item => API._normalizeReasoningValue(item, trimStrings))
        .filter(Boolean)
        .join('\n');
      const result = trimStrings ? normalized.trim() : normalized;
      if (result) return result;
    }
    return '';
  },
  _extractReasoning(source, trimStrings = true) {
    if (!source || typeof source !== 'object') return '';
    return API._normalizeReasoningValue(
      source.reasoning_content ?? source.reasoning ?? source.reasoning_details,
      trimStrings
    );
  },
  _mergeReasoningAndContent(reasoning, content) {
    const normalizedReasoning = API._normalizeReasoningValue(reasoning);
    const normalizedContent = typeof content === 'string' ? content : '';

    if (!normalizedReasoning) return normalizedContent || null;
    if (normalizedContent.includes('<think>')) return normalizedContent;

    return `<think>\n${normalizedReasoning}\n</think>${normalizedContent ? `\n${normalizedContent}` : ''}`;
  },
  _params(msgs, model, stream) {
    const baseParams = {
      model: model || state.model,
      messages: Context.buildMessages(msgs),
      stream,
      seed: Math.floor(Math.random() * 2147483647),
      temperature: state.temperature,
      top_p: state.topP
    };
    
    const modeConfig = state.modeConfig[state.currentMode];
    
    return {
      ...baseParams,
      ...modeConfig
    };
  },
  async fetch(msgs, model) {
    const r = await fetch(`${API_BASE}/v1/chat/completions`, {
      method:'POST',
      headers:{'Authorization':`Bearer ${state.activeKey}`,'Content-Type':'application/json'},
      body: JSON.stringify(API._params(msgs, model, false))
    });
    if (r.status===401||r.status===403) { return null; }
    if (!r.ok) {
      let msg=`HTTP ${r.status}`;
      try{const e=await r.json();msg=e?.error?.message||msg;}catch{}
      throw new Error(msg);
    }
    const d = await r.json();
    const message = d.choices?.[0]?.message;
    return API._mergeReasoningAndContent(API._extractReasoning(message, true), message?.content);
  },
  async *stream(msgs, model) {
    const r = await fetch(`${API_BASE}/v1/chat/completions`, {
      method:'POST',
      headers:{'Authorization':`Bearer ${state.activeKey}`,'Content-Type':'application/json'},
      body: JSON.stringify(API._params(msgs, model, true))
    });
    if (r.status===401||r.status===403) { return; }
    if (!r.ok) {
      let msg=`HTTP ${r.status}`;
      try{const e=await r.json();msg=e?.error?.message||msg;}catch{}
      throw new Error(msg);
    }
    if (!r.body) {
      const txt = await r.text();
      try {
        const d = JSON.parse(txt);
        const message = d.choices?.[0]?.message;
        const merged = API._mergeReasoningAndContent(API._extractReasoning(message, true), message?.content);
        if (merged) yield merged;
      } catch {}
      return;
    }
    const reader=r.body.getReader(), dec=new TextDecoder();
    let buf='';
    let inThinking = false;
    while (true) {
      if (state.stopRequested) { try{reader.cancel();}catch{} return; }
      const {done,value} = await reader.read();
      if (done) break;
      buf += dec.decode(value, {stream:true});
      const lines = buf.split('\n'); buf = lines.pop();
      for (const line of lines) {
        if (state.stopRequested) return;
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data==='[DONE]') {
          if (inThinking) yield '</think>';
          return;
        }
        try {
          const p = JSON.parse(data);
          const delta = p.choices?.[0]?.delta;
          const reasoning = API._extractReasoning(delta, false);
          const content = delta?.content;

          if (reasoning) {
            if (!inThinking) {
              yield '<think>';
              inThinking = true;
            }
            yield reasoning;
          }

          if (content) {
            if (inThinking && !content.includes('</think>')) {
              yield '</think>';
              inThinking = false;
            }
            yield content;
            if (content.includes('</think>')) {
              inThinking = false;
            } else if (content.includes('<think>')) {
              inThinking = true;
            }
          }
        } catch {}
      }
    }
    if (inThinking) yield '</think>';
  },
  async validateKey(key) {
    key = key.trim();
    if (!/^(pk_|sk_)[A-Za-z0-9]{8,}$/.test(key)) return false;
    try {
      const r = await fetch(`${API_BASE}/text/hello?key=${encodeURIComponent(key)}`);
      if (r.status === 401) return false;
      return true;
    } catch {
      return true;
    }
  }
};
