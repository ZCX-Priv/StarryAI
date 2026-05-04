/* ─── Context - AI模型上下文管理 ───────────────────────── */
const Context = {
  LANG_NAMES: {
    pt:'Portuguese (Brazilian)', en:'English', es:'Spanish', fr:'French',
    de:'German', it:'Italian', ja:'Japanese', zh:'Chinese (Simplified)', ko:'Korean', ru:'Russian'
  },

  hasLanguagePreference() {
    return state.memory.some(m =>
      /\b(language|idioma|l[íi]ngua|sprache|langue|lingua|言語|语言|언어|язык|prefer.*speak|speak.*prefer|fala|gosta.*escrever)\b/i.test(m)
    );
  },

  getLanguageName() {
    return this.LANG_NAMES[state.lang] || 'English';
  },

  Memory: {
    async extract(recentMsgs) {
      if (!state.activeKey||recentMsgs.length<2) return;
      try {
        const existing=state.memory.length ? state.memory.map((m,i)=>`${i+1}. ${m}`).join('\n') : '(vazia)';
        const systemPrompt = Context.buildMemoryExtractPrompt(existing, recentMsgs);
        const r=await fetch(`${API_BASE}/v1/chat/completions`,{
          method:'POST',
          headers:{'Authorization':`Bearer ${state.activeKey}`,'Content-Type':'application/json'},
          body:JSON.stringify({
            model:'nova-fast', stream:false, temperature:0.3,
            seed:Math.floor(Math.random()*2147483647),
            messages:[
              {role:'system', content:systemPrompt},
              {role:'user', content:`Conversation:\n${JSON.stringify(recentMsgs)}`}
            ]
          })
        });
        if (!r.ok) return;
        const d=await r.json();
        const raw=(d.choices?.[0]?.message?.content||'[]').replace(/```json|```/g,'').trim();
        let facts; try{ facts=JSON.parse(raw); }catch{ return; }
        if (!Array.isArray(facts)||!facts.length) return;
        const newFacts=facts.filter(f=>typeof f==='string'&&f.trim().length>3);
        if (!newFacts.length) return;
        state.memory.push(...newFacts);
        await Context.Memory.deduplicate();
        Store.saveMemory(); UI.updateMemoryBadge();
      } catch {}
    },

    async deduplicate() {
      if (state.memory.length<5) return;
      try {
        const systemPrompt = Context.buildMemoryDeduplicatePrompt(state.memory, MEMORY_MAX_BLOCKS);
        const r=await fetch(`${API_BASE}/v1/chat/completions`,{
          method:'POST',
          headers:{'Authorization':`Bearer ${state.activeKey}`,'Content-Type':'application/json'},
          body:JSON.stringify({
            model:'nova-fast', stream:false, temperature:0.2,
            seed:Math.floor(Math.random()*2147483647),
            messages:[
              {role:'system', content:systemPrompt},
              {role:'user', content:`Memory to clean:\n${JSON.stringify(state.memory)}`}
            ]
          })
        });
        if (!r.ok) return;
        const d=await r.json();
        const raw=(d.choices?.[0]?.message?.content||'[]').replace(/```json|```/g,'').trim();
        let cleaned; try{ cleaned=JSON.parse(raw); }catch{ return; }
        if (Array.isArray(cleaned)&&cleaned.length) state.memory=cleaned.slice(0,MEMORY_MAX_BLOCKS);
      } catch { state.memory=state.memory.slice(-MEMORY_MAX_BLOCKS); }
    },

    clear() { state.memory=[]; Store.saveMemory(); UI.updateMemoryBadge(); Modals.renderMemory(); UI.showToast('记忆已清除'); },

    editItem(i) {
      const el=document.getElementById(`mt-${i}`);
      el.contentEditable='true'; el.focus();
      el.addEventListener('blur',()=>{ el.contentEditable='false'; state.memory[i]=el.textContent.trim(); Store.saveMemory(); },{once:true});
      const r=document.createRange(); r.selectNodeContents(el);
      window.getSelection().removeAllRanges(); window.getSelection().addRange(r);
    },

    deleteItem(i) { state.memory.splice(i,1); Store.saveMemory(); UI.updateMemoryBadge(); Modals.renderMemory(); UI.showToast('记忆已删除'); }
  },

  buildSystemPrompt() {
    const templatePrompt = Prompts.buildSystemPromptFromTemplate();
    if (templatePrompt) {
      if (state.modePrompt) {
        return templatePrompt + '\n\n' + state.modePrompt;
      }
      return templatePrompt;
    }

    const langName = this.getLanguageName();
    const memHasLang = this.hasLanguagePreference();
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
    
    if (state.modePrompt) {
      p += '\n\n' + state.modePrompt;
    }
    
    return p;
  },

  buildMemoryExtractPrompt(existingMemory, conversation) {
    if (!state.memoryExtractTemplate) {
      return `You are a memory manager for an AI assistant. Extract only truly new and durable personal facts about the USER.\n\nSTRICT RULES:\n1. Only facts about the USER — never AI responses.\n2. Only NEW facts NOT already in existing memory.\n3. If a topic already exists (e.g. "user likes anime"), do NOT add more about that same topic unless it is a completely different type of fact.\n4. Skip transient/task info. Only durable: name, language, tone, profession, core interests (one per topic), habits.\n5. Max 10 words per fact.\n6. If nothing new: return exactly []\n7. Return ONLY a valid JSON array of strings.\n\nExisting memory — do NOT duplicate these topics:\n${existingMemory}`;
    }

    return Prompts.parsePromptTemplate(state.memoryExtractTemplate, {
      existing_memory: existingMemory,
      conversation: JSON.stringify(conversation)
    });
  },

  buildMemoryDeduplicatePrompt(memoryList, maxEntries) {
    if (!state.memoryDeduplicateTemplate) {
      return `You are a memory optimizer. Clean and deduplicate a list of user facts.\n\nRULES:\n- Merge all facts about the same topic into ONE concise entry. Keep only the ESSENCE.\n- Remove redundant, overly specific, or repetitive entries.\n- Limit to ONE entry per topic/interest area.\n- Keep ONLY high-value durable facts: name, language preference, tone, profession, core interests (one per area), habits.\n- Max ${maxEntries} entries. Max 12 words each.\n- Return ONLY a valid JSON array of strings. Nothing else.`;
    }

    return Prompts.parsePromptTemplate(state.memoryDeduplicateTemplate, {
      memory_list: JSON.stringify(memoryList),
      max_entries: maxEntries
    });
  },

  buildMessages(msgs) {
    const sys = this.buildSystemPrompt();
    return sys ? [{role:'system', content:sys}, ...msgs] : msgs;
  }
};

const Memory = Context.Memory;
