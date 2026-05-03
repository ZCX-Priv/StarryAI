/* ─── Memory ────────────────────────────────────────── */
const Memory = {
  async extract(recentMsgs) {
    if (!state.activeKey||recentMsgs.length<2) return;
    try {
      const existing=state.memory.length ? state.memory.map((m,i)=>`${i+1}. ${m}`).join('\n') : '(vazia)';
      const r=await fetch(`${API_BASE}/v1/chat/completions`,{
        method:'POST',
        headers:{'Authorization':`Bearer ${state.activeKey}`,'Content-Type':'application/json'},
        body:JSON.stringify({
          model:'nova-fast', stream:false, temperature:0.3,
          seed:Math.floor(Math.random()*2147483647),
          messages:[
            {role:'system', content:`You are a memory manager for an AI assistant. Extract only truly new and durable personal facts about the USER.\n\nSTRICT RULES:\n1. Only facts about the USER — never AI responses.\n2. Only NEW facts NOT already in existing memory.\n3. If a topic already exists (e.g. "user likes anime"), do NOT add more about that same topic unless it is a completely different type of fact.\n4. Skip transient/task info. Only durable: name, language, tone, profession, core interests (one per topic), habits.\n5. Max 10 words per fact.\n6. If nothing new: return exactly []\n7. Return ONLY a valid JSON array of strings.\n\nExisting memory — do NOT duplicate these topics:\n${existing}`},
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
      await Memory.deduplicate();
      Store.saveMemory(); UI.updateMemoryBadge();
    } catch {}
  },
  async deduplicate() {
    if (state.memory.length<5) return;
    try {
      const r=await fetch(`${API_BASE}/v1/chat/completions`,{
        method:'POST',
        headers:{'Authorization':`Bearer ${state.activeKey}`,'Content-Type':'application/json'},
        body:JSON.stringify({
          model:'nova-fast', stream:false, temperature:0.2,
          seed:Math.floor(Math.random()*2147483647),
          messages:[
            {role:'system', content:`You are a memory optimizer. Clean and deduplicate a list of user facts.\n\nRULES:\n- Merge all facts about the same topic into ONE concise entry. Keep only the ESSENCE.\n- Remove redundant, overly specific, or repetitive entries.\n- Limit to ONE entry per topic/interest area.\n- Keep ONLY high-value durable facts: name, language preference, tone, profession, core interests (one per area), habits.\n- Max ${MEMORY_MAX_BLOCKS} entries. Max 12 words each.\n- Return ONLY a valid JSON array of strings. Nothing else.`},
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
};
