import useAppStore from '@/store/useAppStore';
import { getCurrentTimeInfo } from '@/context/time';

import soulMd from '@/prompts/soul.md?raw';
import memoryExtractMd from '@/prompts/memory-extract.md?raw';
import memoryDeduplicateMd from '@/prompts/memory-deduplicate.md?raw';
import modeFastMd from '@/prompts/mode/fast.md?raw';
import modeThinkingMd from '@/prompts/mode/thinking.md?raw';
import modeExpertMd from '@/prompts/mode/expert.md?raw';

const modePrompts = {
  fast: modeFastMd,
  thinking: modeThinkingMd,
  expert: modeExpertMd,
};

export function loadMainPrompt() {
  const store = useAppStore.getState();
  if (soulMd) {
    store.setMainPromptTemplate(soulMd);
    return soulMd;
  }
  return null;
}

export function loadMemoryPrompts() {
  const store = useAppStore.getState();
  if (memoryExtractMd) {
    store.setMemoryExtractTemplate(memoryExtractMd);
  }
  if (memoryDeduplicateMd) {
    store.setMemoryDeduplicateTemplate(memoryDeduplicateMd);
  }
  return true;
}

export function loadModePrompt(mode) {
  const store = useAppStore.getState();
  const template = modePrompts[mode];
  if (template) {
    store.setModePrompt(template);
    return template;
  }
  console.warn(`Failed to load ${mode}.md`);
  return null;
}

export function parsePromptTemplate(template, variables) {
  if (!template) return null;

  let result = template;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{${key}}`;
    result = result.replace(new RegExp(placeholder, 'g'), value);
  }

  return result;
}

export function extractSection(template, sectionTitle) {
  if (!template) return null;

  const regex = new RegExp(`## ${sectionTitle}\\n([\\s\\S]*?)(?=\\n## |$)`, 'i');
  const match = template.match(regex);

  return match ? match[1].trim() : null;
}

export function buildSystemPromptFromTemplate() {
  const state = useAppStore.getState();

  if (!state.mainPromptTemplate) {
    return null;
  }

  let prompt = '';

  if (state.mainPromptTemplate) {
    prompt += state.mainPromptTemplate + '\n\n';
  }

  if (state.modePrompt) {
    prompt += state.modePrompt + '\n\n';
  }

  if (state.agentPrompt) {
    prompt += state.agentPrompt + '\n\n';
  }

  if (state.bannerPrompt) {
    prompt += state.bannerPrompt + '\n\n';
  }

  if (state.memory.length) {
    prompt += `## 关于用户的背景信息:\n${state.memory.map(m => `- ${m}`).join('\n')}\n\n`;
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
