# 修复计划：思考过程展开/收起与标题状态

## Summary

修改思考过程（ThinkingBlock）的交互行为：

1. **thinking 进行中默认展开**：当 thinking 内容正在流式输出时，思考块默认展开显示。
2. **thinking 完成后自动收起**：当 thinking 结束（think 标签闭合）后，思考块自动收起。
3. **完成后标题变为"已完成思考"**：thinking 结束后，按钮标题从"思考过程"变为"已完成思考"。

## Current State Analysis

* `src/render/ThinkingBlock.tsx`：当前默认 `expanded = false`（收起），标题固定为"思考过程"，props 只有 `content`。

* `src/render/extractThinking.ts`：返回 `thinkingParts: string[]`，仅包含 thinking 文本内容，不包含每个 thinking 块是否已闭合的信息。

* `src/components/chat/MessageBubble.tsx`：调用 `extractThinkingBlocks` 后将 `thinkingParts` 直接映射为 `<ThinkingBlock content={part} />`，未传递 thinking 是否完成的状态。

**问题**：`ThinkingBlock` 无法感知当前 thinking 是"进行中"还是"已完成"，因此无法实现：进行中展开、完成后收起、完成后改标题。

## Proposed Changes

### 文件 1: `src/render/extractThinking.ts`

**What**: 修改返回结构，让 `thinkingParts` 同时携带每个 thinking 块是否已闭合（已完成）的状态。

**How**:

* 将 `ExtractResult` 中的 `thinkingParts` 从 `string[]` 改为 `{ content: string; isComplete: boolean }[]`。

* 在提取逻辑中，根据标签是否闭合设置 `isComplete`：

  * 正常闭合的 thinking 块 → `isComplete: true`

  * 未闭合的 thinking 块（流式中） → `isComplete: false`

### 文件 2: `src/render/ThinkingBlock.tsx`

**What**: 新增 `isComplete` prop，实现默认展开/自动收起/动态标题。

**How**:

* Props 增加 `isComplete: boolean`。

* 初始化 `expanded` 状态：`const [expanded, setExpanded] = useState(!isComplete);`

  * thinking 进行中（`isComplete = false`）→ 默认展开

  * thinking 已完成（`isComplete = true`）→ 默认收起

* 增加 `useEffect` 监听 `isComplete` 变化：当 `isComplete` 从 `false` 变为 `true` 时，执行 `setExpanded(false)` 自动收起。

* 按钮标题动态显示：`{isComplete ? '已完成思考' : '思考过程'}`

### 文件 3: `src/components/chat/MessageBubble.tsx`

**What**: 适配新的 `extractThinkingBlocks` 返回格式，向 `ThinkingBlock` 传递 `isComplete`。

**How**:

* 从 `extractThinkingBlocks` 解构出新的 `thinkingParts` 结构。

* 渲染 `ThinkingBlock` 时传递 `isComplete={part.isComplete}`：

  ```tsx
  <ThinkingBlock key={...} content={part.content} isComplete={part.isComplete} />
  ```

## Assumptions & Decisions

* **假设**：一个 assistant 消息中通常只有一个 thinking 块（由 API reasoning 内容生成）。如有多个，每个块独立管理自己的展开/收起状态和标题。

* **假设**：如果 thinking 被手动终止而未完成，`isComplete` 为 `false`，此时保持展开状态和"思考过程"标题，符合用户预期。

* **决策**：使用 `useEffect` 监听 `isComplete` 变化来自动收起，而不是在初始化时一次性决定。这样可以覆盖流式输出从进行中变为完成的瞬间。

* **决策**：`isComplete` 名称表示"该 thinking 块的内容是否已完整接收（标签已闭合）"，与整个消息是否还在 `isStreaming` 无关。

## Verification Steps

1. 运行 `npm run lint` 检查代码规范。
2. 运行 `npx tsc --noEmit` 检查 TypeScript 类型。
3. 功能验证（需要运行时）：触发带 reasoning 的模型对话，观察：

   * thinking 内容是否在输出期间默认展开。

   * thinking 结束后是否自动收起。

   * 收起后按钮标题是否显示为"已完成思考"。

