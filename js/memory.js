/* ─── Memory ────────────────────────────────────────── */
const Memory = {
  async extract(recentMsgs) {
    if (!state.activeKey||recentMsgs.length<2) return;
    try {
      const existing=state.memory.length ? state.memory.map((m,i)=>`${i+1}. ${m}`).join('\n') : '(vazia)';
      const systemPrompt = Prompts.buildMemoryExtractPrompt(existing, recentMsgs);
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
      await Memory.deduplicate();
      Store.saveMemory(); UI.updateMemoryBadge();
    } catch {}
  },
  async deduplicate() {
    if (state.memory.length<5) return;
    try {
      const systemPrompt = Prompts.buildMemoryDeduplicatePrompt(state.memory, MEMORY_MAX_BLOCKS);
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
};
