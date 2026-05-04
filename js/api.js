/* ─── API ────────────────────────────────────────────── */
/* ─── API ────────────────────────────────────────────── */
const API = {
  _params(msgs, model, stream) {
    return {
      model: model || state.model,
      messages: API.buildMessages(msgs),
      stream,
      temperature: 0.8,
      seed: Math.floor(Math.random() * 2147483647)
    };
  },
  buildMessages(msgs) {
    const sys = API.buildSystemPrompt();
    return sys ? [{role:'system', content:sys}, ...msgs] : msgs;
  },
  buildSystemPrompt() {
    const templatePrompt = Prompts.buildSystemPromptFromTemplate();
    if (templatePrompt) {
      return templatePrompt;
    }
    
    const langNames = {
      pt:'Portuguese (Brazilian)', en:'English', es:'Spanish', fr:'French',
      de:'German', it:'Italian', ja:'Japanese', zh:'Chinese (Simplified)', ko:'Korean', ru:'Russian'
    };
    const langName = langNames[state.lang] || 'English';
    const memHasLang = state.memory.some(m =>
      /\b(language|idioma|l[íi]ngua|sprache|langue|lingua|言語|语言|언어|язык|prefer.*speak|speak.*prefer|fala|gosta.*escrever)\b/i.test(m)
    );
    let p = `You are 星语, a thoughtful and adaptive AI assistant.\n\n`;
    p += `## Core behavior:\n`;
    p += `- Be genuinely helpful and direct. Adapt tone naturally.\n`;
    p += `- Do NOT forcibly reference memory in every response. Use it only when truly relevant.\n`;
    p += `- Memory is background context — it informs your style, not your topic choices.\n`;
    p += `- Never announce that you are using memory.\n\n`;
    if (state.memory.length) {
      p += `## Background context about this user:\n${state.memory.map(m=>`- ${m}`).join('\n')}\n\n`;
      p += `## How to apply this context:\n`;
      p += `- Use preferred name/tone naturally if known.\n`;
      p += `- If user asks about a topic overlapping their interests, acknowledge naturally — do not bring up interests unless the conversation opens that door.\n`;
      p += `- Adapt depth and style to what you know — but respond to what they ASKED.\n\n`;
    }
    p += memHasLang
      ? `## Language: Use the language recorded in context. Maintain it even if the user writes in another language.\n`
      : `## Language: Respond in ${langName} by default. Switch immediately if the user writes in a different language.\n`;
    return p;
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
      // Official lightweight endpoint to verify a key without consuming pollen.
      // 401 = invalid/missing key. 402 = valid key but insufficient balance (key IS good).
      // 403 = valid key but access denied for this resource.
      const r = await fetch(`${API_BASE}/text/hello?key=${encodeURIComponent(key)}`);
      if (r.status === 401) return false;
      return true;
    } catch {
      // Network error: optimistically allow entry so offline users aren't locked out.
      return true;
    }
  }
};
