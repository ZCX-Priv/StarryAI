# 计划：修改对话标题命名时机

## 摘要
将对话标题的命名时机从"收到助手响应后"改为"发送第一条用户消息后立即命名"，字数限制从42改为20。

## 当前状态
- `src/status/chatStore.ts` 第66-68行：`addMessage` 中，当 `messages.length === 2 && role === 'assistant'` 时才设置标题，取第一条用户消息内容，截断至42字。

## 提议变更

### `src/status/chatStore.ts`
修改 `addMessage` 中的标题设置逻辑：

**之前：**
```typescript
if (chat.messages.length === 2 && role === 'assistant') {
  const u = chat.messages[0]?.content || '';
  chat.title = u.slice(0, 42) + (u.length > 42 ? '…' : '');
}
```

**之后：**
```typescript
if (chat.messages.length === 1 && role === 'user') {
  chat.title = content.slice(0, 20) + (content.length > 20 ? '…' : '');
}
```

变更点：
1. 条件从 `messages.length === 2 && role === 'assistant'` 改为 `messages.length === 1 && role === 'user'`
2. 直接使用当前 `content` 参数而非 `chat.messages[0]?.content`
3. 截断长度从42改为20

## 验证步骤
1. 新对话中发送第一条消息 → 侧栏对话标题立即更新为消息内容前20字
2. 标题超过20字时自动截断并加"…"
3. 后续消息不再修改标题
4. 运行 `npx tsc --noEmit` 确认无错误
