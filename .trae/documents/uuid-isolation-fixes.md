# UUID 隔离审查 - 发现问题修复计划

## 审查结论

对话间 UUID 隔离机制**核心逻辑完整**，不存在跨对话污染风险。但审查发现 **2 个次要问题**需要修复。

---

## 问题 1：ThinkingBlock 使用数组索引作为 React key

**文件**: `src/components/chat/MessageBubble.tsx` 第 38 行

**现状**:
```tsx
{hasThinking && thinkingParts.map((part, i) => (
  <ThinkingBlock key={i} content={part} />
))}
```

**问题**: `ThinkingBlock` 组件内部有 `useState(false)` 管理展开/折叠状态。使用数组索引 `i` 作为 key 时，如果流式传输过程中思考块数量变化（如新增一个 `<think/>` 块），React 可能错误复用组件实例，导致展开状态错位。

**实际影响**: 低。当前流式场景中思考块通常是追加而非插入/删除，但不符合 React 最佳实践。

**修复方案**: 使用 `thinkingParts` 内容的哈希或 `think-${i}` 前缀作为 key，确保 key 稳定且唯一：
```tsx
{hasThinking && thinkingParts.map((part, i) => (
  <ThinkingBlock key={`think-${i}-${part.slice(0, 8)}`} content={part} />
))}
```

---

## 问题 2：InputArea 中 chatId 获取存在理论性竞态

**文件**: `src/components/chat/InputArea.tsx` 第 314-321 行

**现状**:
```tsx
if (!activeChatId) await createChat();
// ...
const chatId = useChatStore.getState().activeChatId || activeChatId;
```

**问题**: 
- `activeChatId` 来自 React 闭包，在 `await createChat()` 后可能已过时
- fallback `|| activeChatId` 在新建对话场景下是 `null`，起不到保护作用
- 虽然 `createChat()` 同步更新 store，`getState().activeChatId` 通常能拿到正确值，但逻辑不够清晰

**实际影响**: 极低。`createChat()` 中 store 更新是同步的，`getState()` 能立即获取新值。但代码意图不明确，容易在未来维护中引入 bug。

**修复方案**: 让 `createChat` 返回 chat 对象，直接使用返回值的 id：
```tsx
let chatId = activeChatId;
if (!chatId) {
  const newChat = await createChat();
  chatId = newChat.id;
}
if (!chatId) return;
```

`useChats().createChat` 已经返回 `Promise<Chat>`，所以可以直接使用返回值。

---

## 修改文件清单

| 文件 | 修改内容 |
|------|----------|
| `src/components/chat/MessageBubble.tsx` | 第 38 行：将 `key={i}` 改为 `key={`think-${i}-${part.slice(0, 8)}`}` |
| `src/components/chat/InputArea.tsx` | 第 314-322 行：重构 chatId 获取逻辑，使用 createChat 返回值 |

---

## 验证步骤

1. 运行 `npx tsc --noEmit` 确认类型正确
2. 运行 `npm run lint` 确认无 lint 错误
3. 手动测试：新建对话发送消息，确认消息正确关联到新对话
4. 手动测试：发送包含多个 `<think/>` 块的消息，确认思考块展开/折叠状态正常
