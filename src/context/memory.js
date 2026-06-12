import { useKeyStore, useMemoryStore, useModeStore, useUiStore } from '@/status';
import { API_BASE, MEMORY_MAX_BLOCKS } from '@/lib/config';
import { IDBStore } from '@/services/storage.js';
import { buildMemoryExtractPrompt, buildMemoryDeduplicatePrompt } from './systemPrompt.js';

export { MEMORY_MAX_BLOCKS };

export async function extractMemory(recentMsgs) {
  const keyState = useKeyStore.getState();
  const memoryState = useMemoryStore.getState();
  if (!keyState.activeKey || recentMsgs.length < 2) return;
  try {
    const existing = memoryState.memory.length ? memoryState.memory.map((m, i) => `${i + 1}. ${m}`).join('\n') : '(空)';
    const systemPrompt = buildMemoryExtractPrompt(existing, recentMsgs);
    const r = await fetch(`${API_BASE}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${keyState.activeKey}`, 'Content-Type': 'application/json' },
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
    useMemoryStore.getState().addMemoryItems(newFacts);
    await deduplicateMemory();
    await IDBStore.setMemory(useMemoryStore.getState().memory);
  } catch {}
}

export async function deduplicateMemory() {
  const keyState = useKeyStore.getState();
  const memoryState = useMemoryStore.getState();
  if (memoryState.memory.length < 5) return;
  try {
    const systemPrompt = buildMemoryDeduplicatePrompt(memoryState.memory, MEMORY_MAX_BLOCKS);
    const r = await fetch(`${API_BASE}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${keyState.activeKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'nova-fast', stream: false, temperature: 0.2,
        seed: Math.floor(Math.random() * 2147483647),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `待清理记忆:\n${JSON.stringify(memoryState.memory)}` }
        ]
      })
    });
    if (!r.ok) return;
    const d = await r.json();
    const raw = (d.choices?.[0]?.message?.content || '[]').replace(/```json|```/g, '').trim();
    let cleaned;
    try { cleaned = JSON.parse(raw); } catch { return; }
    if (Array.isArray(cleaned) && cleaned.length) {
      useMemoryStore.getState().setMemoryItems(cleaned.slice(0, MEMORY_MAX_BLOCKS));
    }
  } catch {
    useMemoryStore.getState().setMemoryItems(memoryState.memory.slice(-MEMORY_MAX_BLOCKS));
  }
}

export async function clearMemory() {
  useMemoryStore.getState().clearMemory();
  await IDBStore.setMemory([]);
  useUiStore.getState().showToast('记忆已清除');
}

export async function editMemoryItem(i, value) {
  useMemoryStore.getState().editMemoryItem(i, value);
  await IDBStore.setMemory(useMemoryStore.getState().memory);
}

export async function deleteMemoryItem(i) {
  useMemoryStore.getState().deleteMemoryItem(i);
  await IDBStore.setMemory(useMemoryStore.getState().memory);
  useUiStore.getState().showToast('记忆已删除');
}
