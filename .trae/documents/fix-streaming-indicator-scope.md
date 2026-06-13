# 修复流式指示器在所有对话中显示的问题

## 问题分析

`streamStore` 已有 `streamingChatId` 字段，`Sidebar.tsx` 正确使用了它来按对话显示转圈图标。但 `MessageList.tsx`（三个点动画）和 `StreamStatus.tsx`（"正在生成回复"文字）仅检查全局 `isStreaming` 布尔值，未与 `streamingChatId` 做比对，导致任何对话中都会显示这些指示器。

## 修改方案

### 1. `src/components/chat/MessageList.tsx`

- 新增读取 `streamingChatId` 和 `activeChatId`
- 将 `isStreaming` 条件改为 `isStreamingThisChat`：`isStreaming && streamingChatId === activeChatId`
- 传递给 `MessageBubble` 的 `isStreaming` prop 同样使用 `isStreamingThisChat`

### 2. `src/components/chat/StreamStatus.tsx`

- 新增读取 `streamingChatId` 和 `activeChatId`
- 将 `if (!isStreaming) return null` 改为 `if (!isStreaming || streamingChatId !== activeChatId) return null`

## 验证

1. `npx tsc --noEmit` 零错误
2. 在对话A发送消息，AI回复时：对话A显示三点动画和"正在生成回复"，切换到对话B后不显示
3. 空对话不显示任何流式指示器
