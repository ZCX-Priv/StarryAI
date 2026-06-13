import { useModeStore, useMemoryStore, useAgentStore } from '@/status';
import { getCurrentTimeInfo } from '@/context/time';
import type { ModeType } from '@/types';

import soulMd from '@/prompts/soul.md?raw';
import memoryExtractMd from '@/prompts/memory-extract.md?raw';
import memoryDeduplicateMd from '@/prompts/memory-deduplicate.md?raw';
import modeFastMd from '@/prompts/mode/fast.md?raw';
import modeThinkingMd from '@/prompts/mode/thinking.md?raw';
import modeExpertMd from '@/prompts/mode/expert.md?raw';

const modePrompts: Record<ModeType, string> = {
  fast: modeFastMd,
  thinking: modeThinkingMd,
  expert: modeExpertMd,
};

export function loadMainPrompt(): string | null {
  const store = useModeStore.getState();
  if (soulMd) {
    store.setMainPromptTemplate(soulMd);
    return soulMd;
  }
  return null;
}

export function loadMemoryPrompts(): true {
  const store = useModeStore.getState();
  if (memoryExtractMd) {
    store.setMemoryExtractTemplate(memoryExtractMd);
  }
  if (memoryDeduplicateMd) {
    store.setMemoryDeduplicateTemplate(memoryDeduplicateMd);
  }
  return true;
}

export function loadModePrompt(mode: ModeType): string | null {
  const store = useModeStore.getState();
  const template = modePrompts[mode];
  if (template) {
    store.setModePrompt(template);
    return template;
  }
  console.warn(`Failed to load ${mode}.md`);
  return null;
}

export function parsePromptTemplate(template: string | null, variables: Record<string, string>): string | null {
  if (!template) return null;

  let result = template;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{${key}}`;
    result = result.replace(new RegExp(placeholder, 'g'), value);
  }

  return result;
}

export function extractSection(template: string | null, sectionTitle: string): string | null {
  if (!template) return null;

  const regex = new RegExp(`## ${sectionTitle}\\n([\\s\\S]*?)(?=\\n## |$)`, 'i');
  const match = template.match(regex);

  return match ? match[1].trim() : null;
}

export function buildSystemPromptFromTemplate(): string | null {
  const modeState = useModeStore.getState();
  const memoryState = useMemoryStore.getState();
  const agentState = useAgentStore.getState();

  if (!modeState.mainPromptTemplate) {
    return null;
  }

  let prompt = '';

  if (modeState.mainPromptTemplate) {
    prompt += modeState.mainPromptTemplate + '\n\n';
  }

  if (modeState.modePrompt) {
    prompt += modeState.modePrompt + '\n\n';
  }

  if (agentState.agentPrompt) {
    prompt += agentState.agentPrompt + '\n\n';
  }

  if (modeState.bannerPrompt) {
    prompt += modeState.bannerPrompt + '\n\n';
  }

  if (memoryState.memory.length) {
    prompt += `## 关于用户的背景信息:\n${memoryState.memory.map(m => `- ${m}`).join('\n')}\n\n`;
    prompt += `## 如何应用这些信息:\n`;
    prompt += `- 如果知道用户偏好的称呼或语气，自然地使用。\n`;
    prompt += `- 如果用户询问的话题与其兴趣相关，自然地回应——除非对话涉及到，否则不要主动提起兴趣话题。\n`;
    prompt += `- 根据你了解的信息调整深度和风格——但要回应用户实际询问的内容。\n\n`;
  }

  const timeInfo = getCurrentTimeInfo();
  if (timeInfo) {
    prompt += timeInfo + '\n';
  }

  return prompt;
}
