import useAppStore from '@/store/useAppStore';
import { API_BASE, MEMORY_MAX_BLOCKS } from '@/lib/config';
import { IDBStore } from '@/services/storage.js';
import { buildMemoryExtractPrompt, buildMemoryDeduplicatePrompt } from './systemPrompt.js';

export { MEMORY_MAX_BLOCKS };

export async function extractMemory(recentMsgs) {
  const state = useAppStore.getState();
  if (!state.activeKey || recentMsgs.length < 2) return;
  try {
    const existing = state.memory.length ? state.memory.map((m, i) => `${i + 1}. ${m}`).join('\n') : '(空)';
    const systemPrompt = buildMemoryExtractPrompt(existing, recentMsgs);
    const r = await fetch(`${API_BASE}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${state.activeKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'nova-fast', stream: false, temperature: 0.3,
        seed: Math.floor(Math.random() * 2147483647),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `对话:\n${JSON.stringify(recentMsgs)}` }
        ]
      })
    });
    if (!r.ok) return;
    const d = await r.json();
    const raw = (d.choices?.[0]?.message?.content || '[]').replace(/```json|```/g, '').trim();
    let facts;
    try { facts = JSON.parse(raw); } catch { return; }
    if (!Array.isArray(facts) || !facts.length) return;
    const newFacts = facts.filter(f => typeof f === 'string' && f.trim().length > 3);
    if (!newFacts.length) return;
    useAppStore.getState().addMemoryItems(newFacts);
    await deduplicateMemory();
    await IDBStore.setMemory(useAppStore.getState().memory);
  } catch {}
}

export async function deduplicateMemory() {
  const state = useAppStore.getState();
  if (state.memory.length < 5) return;
  try {
    const systemPrompt = buildMemoryDeduplicatePrompt(state.memory, MEMORY_MAX_BLOCKS);
    const r = await fetch(`${API_BASE}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${state.activeKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'nova-fast', stream: false, temperature: 0.2,
        seed: Math.floor(Math.random() * 2147483647),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `待清理记忆:\n${JSON.stringify(state.memory)}` }
        ]
      })
    });
    if (!r.ok) return;
    const d = await r.json();
    const raw = (d.choices?.[0]?.message?.content || '[]').replace(/```json|```/g, '').trim();
    let cleaned;
    try { cleaned = JSON.parse(raw); } catch { return; }
    if (Array.isArray(cleaned) && cleaned.length) {
      useAppStore.getState().setMemoryItems(cleaned.slice(0, MEMORY_MAX_BLOCKS));
    }
  } catch {
    useAppStore.getState().setMemoryItems(state.memory.slice(-MEMORY_MAX_BLOCKS));
  }
}

export async function clearMemory() {
  useAppStore.getState().clearMemory();
  await IDBStore.setMemory([]);
  useAppStore.getState().showToast('记忆已清除');
}

export async function editMemoryItem(i, value) {
  useAppStore.getState().editMemoryItem(i, value);
  await IDBStore.setMemory(useAppStore.getState().memory);
}

export async function deleteMemoryItem(i) {
  useAppStore.getState().deleteMemoryItem(i);
  await IDBStore.setMemory(useAppStore.getState().memory);
  useAppStore.getState().showToast('记忆已删除');
}
