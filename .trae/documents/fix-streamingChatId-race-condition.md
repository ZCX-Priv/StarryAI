# 修复流式完成后误清除其他对话的指示器

## 问题根因

`handleSend` 和 `handleRegenerate` 在流式结束时无条件调用 `setStreamingChatId(null)`。如果用户在对话A流式回复期间切换到对话B并发送新消息，对话A完成时会清除 `streamingChatId`，导致对话B的指示器也消失。

## 修改方案

在 `setStreamingChatId(null)` 前增加守卫：只有当 `streamingChatId` 仍等于当前对话ID时才清除。

### 1. `src/components/chat/InputArea.tsx` — handleSend
```typescript
// 替换
setStreamingChatId(null);
// 为
if (useStreamStore.getState().streamingChatId === chatId) {
  setStreamingChatId(null);
}
```

### 2. `src/components/chat/ChatArea.tsx` — handleRegenerate
```typescript
// 替换
setStreamingChatId(null);
// 为
if (useStreamStore.getState().streamingChatId === chatId) {
  setStreamingChatId(null);
}
```

## 验证
1. `npx tsc --noEmit` 零错误
