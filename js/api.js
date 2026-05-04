/* ─── API ────────────────────────────────────────────── */
const API = {
  _params(msgs, model, stream) {
    const baseParams = {
      model: model || state.model,
      messages: Context.buildMessages(msgs),
      stream,
      seed: Math.floor(Math.random() * 2147483647)
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
    return d.choices?.[0]?.message?.content || null;
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
      try { const d=JSON.parse(txt); const c=d.choices?.[0]?.message?.content; if(c) yield c; } catch {}
      return;
    }
    const reader=r.body.getReader(), dec=new TextDecoder();
    let buf='';
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
        if (data==='[DONE]') return;
        try { const p=JSON.parse(data); const c=p.choices?.[0]?.delta?.content; if(c) yield c; } catch {}
      }
    }
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
