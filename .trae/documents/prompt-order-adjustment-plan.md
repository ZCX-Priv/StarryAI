# 提示词顺序调整实施计划

## 目标

调整系统提示词的组装顺序，使其按照以下顺序构建：

1. main.md（系统基本设定）
2. agent提示词
3. banner提示词（功能）
4. 上下文（前文+用户问题）
5. 当前时间（新建time.js处理）

## 当前状态分析

### 现有提示词组装流程

* `Context.buildMessages(msgs)` → `SystemPrompt.buildMessages(msgs)` → `SystemPrompt.buildSystemPrompt()` → `Prompts.buildSystemPromptFromTemplate()`

* 当前顺序：agent提示词 → main.md部分内容 → memory上下文 → 语言设置

* banner提示词目前是作为用户消息的一部分处理，而不是系统提示词的一部分

### 需要修改的文件

1. `js/context/time.js` - 新建文件，处理当前时间生成
2. `js/prompts.js` - 修改 `buildSystemPromptFromTemplate()` 方法
3. `js/context/index.js` - 添加时间模块的引用
4. `js/context/system-prompt.js` - 可能需要调整

## 实施步骤

### 步骤1：创建时间处理模块

**文件**：`js/context/time.js`

**功能**：

* 获取当前日期（公历）

* 计算农历日期

* 判断节日/节气

* 格式化输出字符串

**实现要点**：

* 使用农历算法计算农历日期

* 内置常见节日和节气数据

* 输出格式：`今天的日期：2026年05月10日，星期日，农历：丙午年三月廿四(马年)，今日节日/节气：无`

### 步骤2：修改提示词构建逻辑

**文件**：`js/prompts.js`

**修改** **`buildSystemPromptFromTemplate()`** **方法**：

新的组装顺序：

```javascript
buildSystemPromptFromTemplate() {
  let prompt = '';
  
  // 1. main.md（系统基本设定）- 完整内容
  if (state.mainPromptTemplate) {
    prompt += state.mainPromptTemplate + '\n\n';
  }
  
  // 2. agent提示词
  if (state.agentPrompt) {
    prompt += state.agentPrompt + '\n\n';
  }
  
  // 3. banner提示词（功能）
  if (state.bannerPrompt) {
    prompt += state.bannerPrompt + '\n\n';
  }
  
  // 4. 上下文（前文+用户问题）- memory
  if (state.memory.length) {
    prompt += `## Background context about this user:\n${state.memory.map(m=>`- ${m}`).join('\n')}\n\n`;
    prompt += `## How to apply this context:\n`;
    prompt += `- Use preferred name/tone naturally if known.\n`;
    prompt += `- If user asks about a topic overlapping their interests, acknowledge naturally.\n`;
    prompt += `- Adapt depth and style to what you know.\n\n`;
  }
  
  // 5. 当前时间
  const timeInfo = Time.getCurrentTimeInfo();
  if (timeInfo) {
    prompt += timeInfo + '\n';
  }
  
  return prompt;
}
```

### 步骤3：集成时间模块到Context

**文件**：`js/context/index.js`

**修改**：

* 引入Time模块

* 添加获取时间信息的方法

### 步骤4：调整banner提示词的处理方式

**文件**：`js/chat.js`

**修改** **`send()`** **方法**：

* 移除将banner提示词插入用户消息的逻辑

* banner提示词现在作为系统提示词的一部分，不需要在用户消息中处理

### 步骤5：测试验证

* 测试各种场景下的提示词组装

* 验证时间显示的准确性

* 确保各模块提示词正确拼接

## 技术细节

### 农历算法

需要实现或使用农历转换算法，包括：

* 公历转农历

* 天干地支计算

* 生肖年份计算

### 节日节气数据

内置常见节日和24节气：

* 公历节日：元旦、劳动节、国庆节等

* 农历节日：春节、中秋、端午等

* 24节气：立春、雨水、惊蛰等

### 时间格式

```
今天的日期：2026年05月10日星期日，农历：丙午年三月廿四(马年)，今日节日/节气：无
```

## 注意事项

1. **向后兼容**：确保修改不影响现有功能
2. **性能考虑**：时间计算应该高效，避免每次请求都重新计算
3. **错误处理**：如果时间模块出错，不应影响整个系统
4. **可维护性**：代码应该清晰、易于维护

## 文件修改清单

| 文件                            | 操作   | 说明                   |
| ----------------------------- | ---- | -------------------- |
| `js/context/time.js`          | 新建   | 时间处理模块               |
| `js/prompts.js`               | 修改   | 调整提示词构建顺序            |
| `js/context/index.js`         | 修改   | 集成时间模块               |
| `js/chat.js`                  | 修改   | 移除banner提示词插入用户消息的逻辑 |
| `js/context/system-prompt.js` | 可能修改 | 根据需要调整               |

## 预期结果

完成后的系统提示词结构：

```
[main.md完整内容]

[agent提示词]

[banner提示词]

[用户上下文]

[memory]

今天的日期：2026年05月10日星期日，农历：丙午年三月廿四(马年)，今日节日/节气：无
```

