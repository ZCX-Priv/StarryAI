import { API_BASE } from '@/lib/config';
import { useModelStore, useModeStore, useKeyStore, useStreamStore, useUiStore } from '@/status';
import type { Message, ModelInfo, ModeConfig } from '@/types';

function _normalizeReasoningValue(value: unknown, trimStrings = true): string {
  if (!value) return '';
  if (typeof value === 'string') return trimStrings ? value.trim() : value;
  if (Array.isArray(value)) {
    const merged = value.map(item => _normalizeReasoningValue(item, trimStrings)).filter(Boolean).join('\n');
    return trimStrings ? merged.trim() : merged;
  }
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    const candidates = [obj.text, obj.content, obj.reasoning, obj.reasoning_content, obj.summary];
    const normalized = candidates.map(item => _normalizeReasoningValue(item, trimStrings)).filter(Boolean).join('\n');
    return trimStrings ? normalized.trim() : normalized;
  }
  return '';
}

function _extractReasoning(source: unknown, trimStrings = true): string {
  if (!source || typeof source !== 'object') return '';
  const obj = source as Record<string, unknown>;
  return _normalizeReasoningValue(obj.reasoning_content ?? obj.reasoning ?? obj.reasoning_details, trimStrings);
}

function _mergeReasoningAndContent(reasoning: unknown, content: unknown): string | null {
  const nr = _normalizeReasoningValue(reasoning);
  const nc = typeof content === 'string' ? content : '';
  if (!nr) return nc || null;
  if (nc.includes('</think')) return nc;
  return `<think/>\n${nr}\n</think/>\n${nc ? `\n${nc}` : ''}`;
}

interface BuildParamsResult {
  model: string;
  messages: Message[];
  stream: boolean;
  seed: number;
  temperature: number;
  top_p: number;
  [key: string]: unknown;
}

function _buildParams(msgs: Message[], model?: string): BuildParamsResult {
  const modelState = useModelStore.getState();
  const modeState = useModeStore.getState();
  const baseParams: BuildParamsResult = {
    model: model || modelState.model,
    messages: msgs,
    stream: true,
    seed: Math.floor(Math.random() * 2147483647),
    temperature: modelState.temperature,
    top_p: modelState.topP,
  };
  const modeConfig: ModeConfig = modeState.modeConfig[modeState.currentMode] || {};
  return { ...baseParams, ...modeConfig };
}

async function fetchAPI(msgs: Message[], model?: string, _signal?: AbortSignal): Promise<string | null> {
  const keyState = useKeyStore.getState();
  let r: Response;
  try {
    r = await fetch(`${API_BASE}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${keyState.activeKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(_buildParams(msgs, model)),
      signal: _signal,
    });
  } catch (e: unknown) {
    if (_signal?.aborted || (e instanceof DOMException && e.name === 'AbortError')) return null;
    throw e;
  }
  if (r.status === 401 || r.status === 403) {
    useUiStore.getState().showToast('API 密钥无效或已过期', 'error');
    return null;
  }
  if (!r.ok) {
    let msg = `HTTP ${r.status}`;
    try { const e = await r.json(); msg = e?.error?.message || msg; } catch { /* ignored */ }
    throw new Error(msg);
  }
  const d = await r.json();
  const message = d.choices?.[0]?.message;
  return _mergeReasoningAndContent(_extractReasoning(message, true), message?.content);
}

async function* streamAPI(msgs: Message[], model?: string, chatId?: string, signal?: AbortSignal): AsyncGenerator<string, void, unknown> {
  const keyState = useKeyStore.getState();
  let r: Response;
  try {
    r = await fetch(`${API_BASE}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${keyState.activeKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(_buildParams(msgs, model)),
      signal,
    });
  } catch (e: unknown) {
    if (signal?.aborted || (e instanceof DOMException && e.name === 'AbortError')) return;
    throw e;
  }
  if (r.status === 401 || r.status === 403) {
    useUiStore.getState().showToast('API 密钥无效或已过期', 'error');
    return;
  }
  if (!r.ok) {
    let msg = `HTTP ${r.status}`;
    try { const e = await r.json(); msg = e?.error?.message || msg; } catch { /* ignored */ }
    throw new Error(msg);
  }
  if (!r.body) {
    const txt = await r.text();
    try {
      const d = JSON.parse(txt);
      const message = d.choices?.[0]?.message;
      const merged = _mergeReasoningAndContent(_extractReasoning(message, true), message?.content);
      if (merged) yield merged;
    } catch { /* ignored */ }
    return;
  }
  const reader = r.body.getReader(), dec = new TextDecoder();
  let buf = '';
  let inThinking = false;
  while (true) {
    if (signal?.aborted || (chatId && useStreamStore.getState().isStopRequested(chatId))) { try { reader.cancel(); } catch { /* ignored */ } return; }
    let done: boolean;
    let value: Uint8Array | undefined;
    try {
      ({ done, value } = await reader.read());
    } catch (e: unknown) {
      if (signal?.aborted || (e instanceof DOMException && e.name === 'AbortError')) return;
      throw e;
    }
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split('\n'); buf = lines.pop()!;
    for (const line of lines) {
      if (signal?.aborted || (chatId && useStreamStore.getState().isStopRequested(chatId))) return;
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
      } catch { /* ignored */ }
    }
  }
  if (inThinking) yield '</think/>';
}

async function validateKey(key: string): Promise<boolean> {
  key = key.trim();
  if (!/^(pk_|sk_)[A-Za-z0-9]{8,}$/.test(key)) return false;
  try {
    const r = await fetch(`${API_BASE}/text/hello?key=${encodeURIComponent(key)}`);
    if (r.status === 401) return false;
    return true;
  } catch { return true; }
}

async function loadModels(): Promise<ModelInfo[] | null> {
  try {
    const r = await fetch(`${API_BASE}/models`);
    if (r.ok) {
      const data = await r.json();
      const models: ModelInfo[] = data
        .filter((m: Record<string, unknown>) => 
          Array.isArray(m.input_modalities) && m.input_modalities.includes('text') && 
          Array.isArray(m.output_modalities) && m.output_modalities.includes('text') && 
          Array.isArray(m.aliases) && m.aliases.length > 0
        )
        .map((m: Record<string, unknown>) => ({
          id: m.name as string,
          label: (m.aliases as string[])[0],
          pollen: m.pricing ? parseFloat((m.pricing as Record<string, string>).completionTextTokens) : null,
          paidOnly: (m.paid_only as boolean) || false,
          reasoning: (m.reasoning as boolean) || false,
          contextLength: (m.context_length as number) || null,
        }));
      if (models.length > 0) return models;
    }
  } catch { /* ignored */ }
  return null;
}

export const API = {
  fetch: fetchAPI,
  stream: streamAPI,
  validateKey,
  loadModels,
  buildParams: _buildParams,
};
