# 翻译计划：将所有英文改为中文

## 概述

本计划旨在将项目中所有面向用户的英文文本翻译成中文，包括JS文件中的字符串、提示信息等。

## 需要翻译的文件清单

### 1. js/prompts.js

**位置**: 第87-91行

**当前内容**:
```javascript
prompt += `## Background context about this user:\n${state.memory.map(m=>`- ${m}`).join('\n')}\n\n`;
prompt += `## How to apply this context:\n`;
prompt += `- Use preferred name/tone naturally if known.\n`;
prompt += `- If user asks about a topic overlapping their interests, acknowledge naturally — do not bring up interests unless the conversation opens that door.\n`;
prompt += `- Adapt depth and style to what you know — but respond to what they ASKED.\n\n`;
```

**翻译为**:
```javascript
prompt += `## 关于用户的背景信息:\n${state.memory.map(m=>`- ${m}`).join('\n')}\n\n`;
prompt += `## 如何应用这些信息:\n`;
prompt += `- 如果知道用户偏好的称呼或语气，自然地使用。\n`;
prompt += `- 如果用户询问的话题与其兴趣相关，自然地回应——除非对话涉及到，否则不要主动提起兴趣话题。\n`;
prompt += `- 根据你了解的信息调整深度和风格——但要回应用户实际询问的内容。\n\n`;
```

---

### 2. js/context/memory.js

**位置**: 第5行

**当前内容**: `(vazia)`

**翻译为**: `(空)`

---

**位置**: 第15行

**当前内容**: `Conversation:`

**翻译为**: `对话:`

---

**位置**: 第44行

**当前内容**: `Memory to clean:`

**翻译为**: `待清理记忆:`

---

### 3. js/context/system-prompt.js

**位置**: 第11-23行

**当前内容**:
```javascript
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
```

**翻译为**:
```javascript
let p = `你是星语，一个体贴且适应性强的AI助手。\n\n`;
p += `## 核心行为:\n`;
p += `- 真诚地提供帮助，直接回答问题。自然地调整语气。\n`;
p += `- 不要在每次回复中都强行引用记忆。只在真正相关时使用。\n`;
p += `- 记忆是背景信息——它影响你的风格，而不是你的话题选择。\n`;
p += `- 永远不要宣布你正在使用记忆。\n\n`;
if (state.memory.length) {
  p += `## 关于用户的背景信息:\n${state.memory.map(m=>`- ${m}`).join('\n')}\n\n`;
  p += `## 如何应用这些信息:\n`;
  p += `- 如果知道用户偏好的称呼或语气，自然地使用。\n`;
  p += `- 如果用户询问的话题与其兴趣相关，自然地回应——除非对话涉及到，否则不要主动提起兴趣话题。\n`;
  p += `- 根据你了解的信息调整深度和风格——但要回应用户实际询问的内容。\n\n`;
}
```

---

**位置**: 第34行（fallback记忆提取提示词）

**当前内容**:
```javascript
return `You are a memory manager for an AI assistant. Extract only truly new and durable personal facts about the USER.\n\nSTRICT RULES:\n1. Only facts about the USER — never AI responses.\n2. Only NEW facts NOT already in existing memory.\n3. If a topic already exists (e.g. "user likes anime"), do NOT add more about that same topic unless it is a completely different type of fact.\n4. Skip transient/task info. Only durable: name, language, tone, profession, core interests (one per topic), habits.\n5. Max 10 words per fact.\n6. If nothing new: return exactly []\n7. Return ONLY a valid JSON array of strings.\n\nExisting memory — do NOT duplicate these topics:\n${existingMemory}`;
```

**翻译为**:
```javascript
return `你是AI助手的记忆管理器。仅提取关于用户的真正新的、持久的个人事实。\n\n严格规则:\n1. 仅提取关于用户的事实——绝不包括AI的回复。\n2. 仅提取现有记忆中尚未存在的新事实。\n3. 如果某个主题已存在（例如"用户喜欢动漫"），请勿添加关于该主题的更多内容，除非是完全不同类型的事实。\n4. 跳过临时性/任务性信息。仅保留持久性信息：姓名、语言、语气、职业、核心兴趣（每个主题一条）、习惯。\n5. 每个事实最多10个字。\n6. 如果没有新信息：返回精确的 []\n7. 仅返回有效的JSON字符串数组。\n\n现有记忆——请勿重复以下主题:\n${existingMemory}`;
```

---

**位置**: 第45行（fallback记忆去重提示词）

**当前内容**:
```javascript
return `You are a memory optimizer. Clean and deduplicate a list of user facts.\n\nRULES:\n- Merge all facts about the same topic into ONE concise entry. Keep only the ESSENCE.\n- Remove redundant, overly specific, or repetitive entries.\n- Limit to ONE entry per topic/interest area.\n- Keep ONLY high-value durable facts: name, language preference, tone, profession, core interests (one per area), habits.\n- Max ${maxEntries} entries. Max 12 words each.\n- Return ONLY a valid JSON array of strings. Nothing else.`;
```

**翻译为**:
```javascript
return `你是记忆优化器。清理并去重用户事实列表。\n\n规则:\n- 将关于同一主题的所有事实合并为一个简洁条目。仅保留核心要点。\n- 移除冗余、过于具体或重复的条目。\n- 每个主题/兴趣领域仅限一条记录。\n- 仅保留高价值持久性事实：姓名、语言偏好、语气、职业、核心兴趣（每个领域一条）、习惯。\n- 最多${maxEntries}条记录。每条最多12个字。\n- 仅返回有效的JSON字符串数组。不要其他内容。`;
```

---

### 4. js/renderer.js

**位置**: 第122行

**当前内容**: `lang||'code'`

**翻译为**: `lang||'代码'`

---

## 不需要翻译的内容

以下内容不需要翻译：

1. **console.log/warn/error 消息** - 这些是开发者日志，保留英文便于调试
2. **HTML/CSS 类名和ID** - 这些是技术标识符
3. **API URL 和技术参数** - 这些是技术配置
4. **prompts/*.md 文件** - 已经是中文
5. **config/*.json 文件** - 已经是中文
6. **index.html 中的文本** - 已经是中文

---

## 实施步骤

1. 翻译 `js/prompts.js` 中的英文文本
2. 翻译 `js/context/memory.js` 中的英文文本
3. 翻译 `js/context/system-prompt.js` 中的英文文本
4. 翻译 `js/renderer.js` 中的英文文本
5. 测试验证所有功能正常

---

## 预计影响

- **用户体验**: 提升中文用户的使用体验
- **功能**: 无功能变化，仅文本翻译
- **兼容性**: 无兼容性问题
