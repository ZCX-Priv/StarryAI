# 修复计划：思考过程流式渲染与标签闭合格式

## Summary
修复两个相关问题：
1. **思考过程流式实时渲染**：当前思考块只在 `<think/>...</think/>` 完整闭合后才提取渲染，导致流式输出期间思考内容不可见。需改为一旦检测到开始标签即实时渲染。
2. **标签自闭合格式修正**：将 `<think/>` 和 `</think/>` 改为 `<think>` 和 `</think>`，去除末尾的 `/`。

## Current State Analysis

### 流式渲染问题根因
- `src/services/api.ts` 的 `streamAPI` 在流式输出中，当检测到 reasoning 内容时，会 yield `<think/>` 作为开始标签，reasoning 结束后 yield `</think/>` 作为结束标签。
- `src/render/extractThinking.ts` 使用正则 `/<think\/>([\s\S]*?)<\/think\/>/g` 提取思考块。
- `src/components/chat/MessageBubble.tsx` 通过 `useMemo` 调用 `extractThinkingBlocks(content)`，只有正则匹配成功才会渲染 `ThinkingBlock`。
- **问题**：流式过程中，`<think/>` 已经到达但 `</think/>` 尚未到达时，正则无法匹配，思考内容不会被提取，因此用户看不到实时思考过程，必须等流结束或 reasoning 结束后才一次性显示。

### 标签格式问题根因
- `api.ts` 中的 `_mergeReasoningAndContent` 和 `streamAPI` 均使用 `<think/>` / `</think/>` 作为标签。
- `extractThinking.ts` 的正则也使用相同的自闭合格式。
- **问题**：用户要求将自闭合格式 `/>` 改为普通闭合 `>`。

## Proposed Changes

### 文件 1: `src/services/api.ts`
**What**: 将所有 `<think/>` 替换为 `<think>`，将所有 `</think/>` 替换为 `</think>`。

**Where** (共 7 处)：
- 第 31-32 行：`_mergeReasoningAndContent` 函数中的模板字符串
- 第 142 行：`data === '[DONE]'` 时的结束标签 yield
- 第 151 行：`reasoning` 开始时的开始标签 yield
- 第 155 行：`content` 到达时关闭 thinking 的结束标签
- 第 157-158 行：`content` 中包含标签时的状态检测
- 第 163 行：循环结束后关闭 thinking 的结束标签

**How**: 全局字符串替换，`/>` → `>`（注意区分开始标签 `<think/>` 和结束标签 `</think/>`，两者都改）。

### 文件 2: `src/render/extractThinking.ts`
**What**: 
1. 将正则和字符串中的标签从 `<think/>` / `</think/>` 改为 `<think>` / `</think>`。
2. **核心逻辑修改**：增加对"未闭合 thinking 标签"的处理，使其支持流式实时渲染。

**How**: 
重写 `extractThinkingBlocks` 函数逻辑：
- 遍历内容，查找 `<think>` 开始标签。
- 对每个 `<think>`，查找对应的 `</think>`：
  - 如果找到 `</think>`，按正常闭合处理，提取标签间内容。
  - 如果未找到 `</think>``（或 `</think>` 在下一个 `<think>` 之前），说明这是流式输出中的未闭合标签，将 `<think>` 之后直到内容末尾的所有文本都作为 thinking 内容提取。
- 保持 `contentParts` 为 thinking 块之外的内容，`thinkingParts` 为 thinking 块内容。

修改后的伪代码逻辑：
```typescript
export function extractThinkingBlocks(content: string): ExtractResult {
  const thinkingParts: string[] = [];
  const contentParts: string[] = [];
  let lastIndex = 0;
  const openTag = '<think>';
  const closeTag = '</think>';
  
  let i = 0;
  while (i < content.length) {
    const openIndex = content.indexOf(openTag, i);
    if (openIndex === -1) break;
    
    const closeIndex = content.indexOf(closeTag, openIndex);
    
    if (closeIndex === -1) {
      // 未闭合：流式渲染中
      if (openIndex > lastIndex) {
        contentParts.push(content.slice(lastIndex, openIndex));
      }
      thinkingParts.push(content.slice(openIndex + openTag.length).trim());
      lastIndex = content.length;
      break;
    } else {
      // 正常闭合
      if (openIndex > lastIndex) {
        contentParts.push(content.slice(lastIndex, openIndex));
      }
      thinkingParts.push(content.slice(openIndex + openTag.length, closeIndex).trim());
      lastIndex = closeIndex + closeTag.length;
      i = lastIndex;
    }
  }
  
  if (lastIndex < content.length) {
    contentParts.push(content.slice(lastIndex));
  }
  
  return { thinkingParts, contentParts, hasThinking: thinkingParts.length > 0 };
}
```

## Assumptions & Decisions
- **假设**：流式输出中，`<think>` 和 `</think>` 不会交叉嵌套（当前 API 输出行为如此，且原始正则也未处理嵌套）。
- **假设**：`content` 中可能包含多个 thinking 块（原始正则已支持），修改后的逻辑也保持对多块的兼容。
- **决策**：对于未闭合标签，将 `<think>` 之后直到字符串末尾的所有内容视为 thinking 内容。这是流式场景下的正确行为，因为内容还在继续累积。
- **决策**：保留 `trim()` 处理，与原始行为一致。

## Verification Steps
1. 运行 `npm run lint` 检查代码规范。
2. 运行 `npx tsc --noEmit` 检查 TypeScript 类型。
3. 功能验证（需要运行时）：触发一个带 reasoning 的模型对话，观察：
   - 思考内容是否在 `<think>` 标签到达后立即渲染（而非等 `</think>` 到达后）。
   - 最终渲染的标签格式是否为 `<think>` / `</think>`（可通过查看源码或检查 extractThinkingBlocks 正则确认）。
