import { useModeStore, useMemoryStore, useAgentStore } from '@/status';
import { getCurrentTimeInfo } from './time.js';
import { buildSystemPromptFromTemplate, parsePromptTemplate } from '@/lib/prompts.js';

export function buildSystemPrompt() {
  const modeState = useModeStore.getState();
  const memoryState = useMemoryStore.getState();
  const agentState = useAgentStore.getState();
  const templatePrompt = buildSystemPromptFromTemplate();
  if (templatePrompt) {
    if (modeState.modePrompt) {
      return templatePrompt + '\n\n' + modeState.modePrompt;
    }
    return templatePrompt;
  }

  let p = `你是星语，一个体贴且适应性强的AI助手。\n\n`;
  p += `## 核心行为:\n`;
  p += `- 真诚地提供帮助，直接回答问题。自然地调整语气。\n`;
  p += `- 不要在每次回复中都强行引用记忆。只在真正相关时使用。\n`;
  p += `- 记忆是背景信息——它影响你的风格，而不是你的话题选择。\n`;
  p += `- 永远不要宣布你正在使用记忆。\n\n`;
  if (memoryState.memory.length) {
    p += `## 关于用户的背景信息:\n${memoryState.memory.map(m => `- ${m}`).join('\n')}\n\n`;
    p += `## 如何应用这些信息:\n`;
    p += `- 如果知道用户偏好的称呼或语气，自然地使用。\n`;
    p += `- 如果用户询问的话题与其兴趣相关，自然地回应——除非对话涉及到，否则不要主动提起兴趣话题。\n`;
    p += `- 根据你了解的信息调整深度和风格——但要回应用户实际询问的内容。\n\n`;
  }

  if (modeState.modePrompt) {
    p += '\n\n' + modeState.modePrompt;
  }

  return p;
}

export function buildMemoryExtractPrompt(existingMemory, conversation) {
  const modeState = useModeStore.getState();
  if (!modeState.memoryExtractTemplate) {
    return `你是AI助手的记忆管理器。仅提取关于用户的真正新的、持久的个人事实。\n\n严格规则:\n1. 仅提取关于用户的事实——绝不包括AI的回复。\n2. 仅提取现有记忆中尚未存在的新事实。\n3. 如果某个主题已存在（例如"用户喜欢动漫"），请勿添加关于该主题的更多内容，除非是完全不同类型的事实。\n4. 跳过临时性/任务性信息。仅保留持久性信息：姓名、语言、语气、职业、核心兴趣（每个主题一条）、习惯。\n5. 每个事实最多10个字。\n6. 如果没有新信息：返回精确的 []\n7. 仅返回有效的JSON字符串数组。\n\n现有记忆——请勿重复以下主题:\n${existingMemory}`;
  }

  return parsePromptTemplate(modeState.memoryExtractTemplate, {
    existing_memory: existingMemory,
    conversation: JSON.stringify(conversation)
  });
}

export function buildMemoryDeduplicatePrompt(memoryList, maxEntries) {
  const modeState = useModeStore.getState();
  if (!modeState.memoryDeduplicateTemplate) {
    return `你是记忆优化器。清理并去重用户事实列表。\n\n规则:\n- 将关于同一主题的所有事实合并为一个简洁条目。仅保留核心要点。\n- 移除冗余、过于具体或重复的条目。\n- 每个主题/兴趣领域仅限一条记录。\n- 仅保留高价值持久性事实：姓名、语言偏好、语气、职业、核心兴趣（每个领域一条）、习惯。\n- 最多${maxEntries}条记录。每条最多12个字。\n- 仅返回有效的JSON字符串数组。不要其他内容。`;
  }

  return parsePromptTemplate(modeState.memoryDeduplicateTemplate, {
    memory_list: JSON.stringify(memoryList),
    max_entries: maxEntries
  });
}

export function buildMessages(msgs) {
  const sys = buildSystemPrompt();
  return sys ? [{ role: 'system', content: sys }, ...msgs] : msgs;
}
