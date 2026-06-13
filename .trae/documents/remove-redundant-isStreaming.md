# 删除冗余的 isStreaming 状态

## 分析

`isStreaming` 与 `streamingChatId !== null` 完全等价，所有 UI 判断都已改为 `streamingChatId === activeChatId`，`isStreaming` 不再提供额外信息。

另外发现 `handleStop`（InputArea.tsx:369）中 `setIsStreaming(false)` 未配对 `setStreamingChatId(null)`，是一个潜在 bug。

## 修改方案

### 1. `src/status/streamStore.ts`
- 删除 `isStreaming` 状态和 `setIsStreaming` action
- 保留 `streamingChatId`、`stopRequested`、`streamingText`、`autoScroll`

### 2. `src/components/chat/InputArea.tsx`
- 删除 `isStreaming` 和 `setIsStreaming` 读取
- `isStreamingThisChat` 改为 `streamingChatId === activeChatId`
- `handleSend` 中删除 `setIsStreaming(true/false)`，保留 `setStreamingChatId`
- `handleStop` 中 `setIsStreaming(false)` 改为 `setStreamingChatId(null)`
- 清理依赖数组

### 3. `src/components/chat/ChatArea.tsx`
- 删除 `isStreaming` 和 `setIsStreaming` 读取
- `isStreamingThisChat` 改为 `streamingChatId === activeChatId`
- `handleRegenerate` 中删除 `setIsStreaming(true/false)`，保留 `setStreamingChatId`
- 清理依赖数组

### 4. `src/components/chat/MessageList.tsx`
- 删除 `isStreaming` 读取
- `isStreamingThisChat` 改为 `streamingChatId === activeChatId`

### 5. `src/components/chat/StreamStatus.tsx`
- 删除 `isStreaming` 读取
- 条件改为 `if (streamingChatId !== activeChatId) return null`

## 验证
1. `npx tsc --noEmit` 零错误
