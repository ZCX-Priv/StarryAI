# 修复空对话页面"正在生成回复"误显示

## 问题根因

`streamingChatId === activeChatId` 在两者都为 `null` 时结果为 `true`，导致空对话页面误显示流式指示器。

## 修改方案

所有 `isStreamingThisChat` 判断增加 `streamingChatId !== null` 前置条件：

### 1. `src/components/chat/StreamStatus.tsx`
- 条件改为 `if (streamingChatId === null || streamingChatId !== activeChatId) return null;`

### 2. `src/components/chat/MessageList.tsx`
- `isStreamingThisChat` 改为 `streamingChatId !== null && streamingChatId === activeChatId`

### 3. `src/components/chat/InputArea.tsx`
- `isStreamingThisChat` 改为 `streamingChatId !== null && streamingChatId === activeChatId`

### 4. `src/components/chat/ChatArea.tsx`
- `isStreamingThisChat` 改为 `streamingChatId !== null && streamingChatId === activeChatId`

## 验证
1. `npx tsc --noEmit` 零错误
2. 空对话页面不显示"正在生成回复"
