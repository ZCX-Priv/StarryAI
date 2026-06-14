# 修复 Bug：切换聊天后响应指示器消失

## 问题描述

在聊天A发出消息后，点击"新对话"进入空聊天页面，再切回A页面时，三个点的响应指示器消失了，但A页面仍在流式响应中。

## 根因分析

### 核心问题：`streamingChatId` 全局单一值与 `activeChatId` 跨 Store 耦合

指示器显示条件为：
```tsx
const isStreamingThisChat = streamingChatId !== null && streamingChatId === activeChatId;
```

`streamingChatId`（streamStore）和 `activeChatId`（chatStore）分属不同 Store，需要两者保持同步才能正确显示指示器。这种跨 Store 比较的方式存在以下问题：

1. **脆弱的状态同步**：切换聊天时 `activeChatId` 变化，但 `streamingChatId` 不变，导致条件判断依赖两个独立 Store 的值恰好相等
2. **`handleStop` 提前清除状态**：点击停止时立即 `setStreamingChatId(null)`，但流式循环可能仍在运行，造成状态不一致
3. **潜在的 React 渲染时序问题**：切回聊天A时，组件因 `activeChatId` 变化而重新渲染，此时需从 streamStore 读取 `streamingChatId`，如果存在时序偏差可能导致指示器不显示

### 涉及文件

| 文件 | 作用 |
|------|------|
| `src/status/streamStore.ts` | 流式状态 Store，管理 `streamingChatId` |
| `src/components/chat/MessageList.tsx` | 消息列表，包含三个点指示器 |
| `src/components/chat/StreamStatus.tsx` | 流式状态文本提示 |
| `src/components/chat/InputArea.tsx` | 输入区域，包含 handleSend/handleStop |
| `src/components/chat/ChatArea.tsx` | 聊天区域，包含 handleRegenerate |
| `src/components/layout/Sidebar.tsx` | 侧边栏，ChatItem 的 isStreaming 标记 |

## 修复方案

### 核心改动：将 `streamingChatId: string | null` 改为 `streamingChatIds: Set<string>`

将单一的全局流式ID改为 Set 集合，使每个聊天的流式状态独立追踪：

- 指示器条件从 `streamingChatId !== null && streamingChatId === activeChatId` 简化为 `streamingChatIds.has(activeChatId ?? '')`
- 不再依赖两个独立 Store 的值比较，更健壮
- 支持未来多对话同时流式响应

### 附加修复：`handleStop` 不再立即清除流式状态

当前 `handleStop` 立即调用 `setStreamingChatId(null)`，但流式循环可能仍在处理。修改为仅设置 `stopRequested = true`，让流式循环自然结束后再清除状态。

## 具体修改

### 1. `src/status/streamStore.ts`

```typescript
// 改前
streamingChatId: string | null;
setStreamingChatId: (id: string | null) => void;

// 改后
streamingChatIds: Set<string>;
addStreamingChat: (id: string) => void;
removeStreamingChat: (id: string) => void;
clearStreamingChats: () => void;
```

实现：
```typescript
streamingChatIds: new Set<string>(),

addStreamingChat: (id) => set((s) => {
  const next = new Set(s.streamingChatIds);
  next.add(id);
  return { streamingChatIds: next };
}),

removeStreamingChat: (id) => set((s) => {
  const next = new Set(s.streamingChatIds);
  next.delete(id);
  return { streamingChatIds: next };
}),

clearStreamingChats: () => set({ streamingChatIds: new Set<string>() }),
```

### 2. `src/components/chat/MessageList.tsx`

```typescript
// 改前
const streamingChatId = useStreamStore(s => s.streamingChatId);
const isStreamingThisChat = streamingChatId !== null && streamingChatId === activeChatId;

// 改后
const streamingChatIds = useStreamStore(s => s.streamingChatIds);
const isStreamingThisChat = activeChatId !== null && streamingChatIds.has(activeChatId);
```

### 3. `src/components/chat/StreamStatus.tsx`

```typescript
// 改前
if (streamingChatId === null || streamingChatId !== activeChatId) return null;

// 改后
const streamingChatIds = useStreamStore(s => s.streamingChatIds);
if (activeChatId === null || !streamingChatIds.has(activeChatId)) return null;
```

### 4. `src/components/chat/InputArea.tsx`

**更新 isStreamingThisChat：**
```typescript
// 改前
const streamingChatId = useStreamStore(s => s.streamingChatId);
const isStreamingThisChat = streamingChatId !== null && streamingChatId === activeChatId;

// 改后
const streamingChatIds = useStreamStore(s => s.streamingChatIds);
const isStreamingThisChat = activeChatId !== null && streamingChatIds.has(activeChatId);
```

**更新 handleSend 中的流式状态管理：**
```typescript
// 改前
setStreamingChatId(chatId);
// ... stream loop ...
if (useStreamStore.getState().streamingChatId === chatId) {
  setStreamingChatId(null);
}

// 改后
addStreamingChat(chatId);
// ... stream loop ...
if (useStreamStore.getState().streamingChatIds.has(chatId)) {
  removeStreamingChat(chatId);
}
```

**修复 handleStop（不再立即清除流式状态）：**
```typescript
// 改前
const handleStop = () => {
  setStopRequested(true);
  setStreamingChatId(null);
};

// 改后
const handleStop = () => {
  setStopRequested(true);
};
```

### 5. `src/components/chat/ChatArea.tsx`

**更新 isStreamingThisChat：**
```typescript
// 改前
const streamingChatId = useStreamStore(s => s.streamingChatId);
const isStreamingThisChat = streamingChatId !== null && streamingChatId === activeChatId;

// 改后
const streamingChatIds = useStreamStore(s => s.streamingChatIds);
const isStreamingThisChat = activeChatId !== null && streamingChatIds.has(activeChatId);
```

**更新 handleRegenerate 中的流式状态管理：**
```typescript
// 改前
setStreamingChatId(chatId);
// ... stream loop ...
if (useStreamStore.getState().streamingChatId === chatId) {
  setStreamingChatId(null);
}

// 改后
addStreamingChat(chatId);
// ... stream loop ...
if (useStreamStore.getState().streamingChatIds.has(chatId)) {
  removeStreamingChat(chatId);
}
```

### 6. `src/components/layout/Sidebar.tsx`

```typescript
// 改前
const streamingChatId = useStreamStore(s => s.streamingChatId);
// ...
isStreaming={chat.id === streamingChatId}

// 改后
const streamingChatIds = useStreamStore(s => s.streamingChatIds);
// ...
isStreaming={streamingChatIds.has(chat.id)}
```

## 验证步骤

1. 在聊天A发送消息，确认三个点指示器正常显示
2. 点击"新对话"切换到空聊天页面，确认指示器消失（预期）
3. 切回聊天A，确认三个点指示器重新出现
4. 在聊天A发送消息后点击停止按钮，确认指示器正确消失
5. 快速切换多个聊天，确认指示器状态正确
6. 运行 `npm run lint` 和 `npx tsc --noEmit` 确保无类型错误
