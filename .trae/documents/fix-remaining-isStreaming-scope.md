# 修复 InputArea 和 ChatArea 中的全局 isStreaming 问题

## 问题分析

`InputArea.tsx` 和 `ChatArea.tsx` 中仍有多处使用全局 `isStreaming`，未与 `streamingChatId === activeChatId` 比对：

| 文件 | 行号 | 用途 | 问题 |
|------|------|------|------|
| InputArea.tsx | 311 | `if (!text \|\| isStreaming) return;` | 对话A流式回复时，对话B也无法发送消息 |
| InputArea.tsx | 429 | `disabled={!hasText \|\| isStreaming}` | 发送按钮全局禁用 |
| InputArea.tsx | 430 | `isStreaming ? { display: 'none' } : undefined` | 发送按钮全局隐藏 |
| InputArea.tsx | 436 | `` `stop-btn${isStreaming ? ' visible' : ''}` `` | 停止按钮在非流式对话也显示 |
| ChatArea.tsx | 79 | `if (!chat \|\| !chatId \|\| isStreaming) return;` | 对话A流式时，对话B无法重新生成 |

## 修改方案

### 1. `src/components/chat/InputArea.tsx`

新增读取 `streamingChatId`，计算 `isStreamingThisChat = isStreaming && streamingChatId === activeChatId`：

- 行 311：`if (!text || isStreamingThisChat) return;` — 只在当前对话流式时阻止发送
- 行 429：`disabled={!hasText || isStreamingThisChat}` — 只在当前对话流式时禁用发送按钮
- 行 430：`isStreamingThisChat ? { display: 'none' } : undefined` — 只在当前对话流式时隐藏发送按钮
- 行 436：`` `stop-btn${isStreamingThisChat ? ' visible' : ''}` `` — 只在当前对话流式时显示停止按钮

### 2. `src/components/chat/ChatArea.tsx`

新增读取 `streamingChatId`，计算 `isStreamingThisChat`：

- 行 79：`if (!chat || !chatId || isStreamingThisChat) return;` — 只在当前对话流式时阻止重新生成

## 验证

1. `npx tsc --noEmit` 零错误
2. 对话A流式回复时，切换到对话B，可以正常发送消息，看不到停止按钮
3. 对话A流式回复时，对话B可以点击重新生成
