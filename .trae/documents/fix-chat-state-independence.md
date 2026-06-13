# 修复对话状态独立性 & 添加流式回复指示器

## 问题分析

### Bug：消息添加绑定到 activeChatId 而非发起对话

**根因**：`chatStore.ts` 的 `addMessage` 方法通过 `get().activeChatId` 定位目标对话：

```typescript
addMessage: (role, content) => {
  const chat = get().chats.find(c => c.id === get().activeChatId);  // ← 问题所在
  ...
}
```

`useChats.ts` 的 `addMessage` 同样如此：

```typescript
const chat = useChatStore.getState().chats.find(c => c.id === useChatStore.getState().activeChatId);
```

**复现路径**：用户在对话A发送消息 → AI开始流式回复 → 用户切换到对话B → 流式结束后 `addMessage('assistant', fullResp)` 将回复写入对话B。

### 缺失功能：对话列表无流式回复指示

当前 `streamStore` 只有全局的 `isStreaming` 布尔值，无法知道哪个对话正在回复。`ChatItem` 组件也没有任何流式状态展示。

---

## 修改方案

### 1. `chatStore.ts` — addMessage 支持指定 chatId

**文件**：`src/status/chatStore.ts`

- `addMessage` 签名改为 `addMessage: (role, content, chatId?) => void`
- 内部用 `chatId ?? get().activeChatId` 定位目标对话
- 更新 `ChatActions` 接口

```typescript
addMessage: (role: Message['role'], content: string, chatId?: string) => void;
```

```typescript
addMessage: (role, content, chatId) => {
  const targetId = chatId || get().activeChatId;
  const chat = get().chats.find(c => c.id === targetId);
  if (!chat) return;
  chat.messages.push({ role, content, rendered: content, ts: Date.now() });
  if (chat.messages.length === 2 && role === 'assistant') {
    const u = chat.messages[0]?.content || '';
    chat.title = u.slice(0, 42) + (u.length > 42 ? '…' : '');
  }
  set({ chats: [...get().chats] });
},
```

### 2. `useChats.ts` — addMessage 透传 chatId

**文件**：`src/hooks/useChats.ts`

- `addMessage` 签名改为 `addMessage(role, content, chatId?)`
- 内部调用 `useChatStore.getState().addMessage(role, content, chatId)`
- IDB 持久化也用 `chatId ?? activeChatId` 查找对话

```typescript
const addMessage = useCallback(async (role: 'system' | 'user' | 'assistant', content: string, chatId?: string): Promise<void> => {
  useChatStore.getState().addMessage(role, content, chatId);
  const targetId = chatId || useChatStore.getState().activeChatId;
  const chat = useChatStore.getState().chats.find(c => c.id === targetId);
  if (chat) await IDBStore.saveChat(chat);
}, []);
```

### 3. `streamStore.ts` — 添加 streamingChatId

**文件**：`src/status/streamStore.ts`

- 新增状态 `streamingChatId: string | null`
- 新增 action `setStreamingChatId: (id: string | null) => void`
- 更新 `StreamState` 和 `StreamActions` 接口

```typescript
interface StreamState {
  isStreaming: boolean;
  stopRequested: boolean;
  streamingText: string;
  autoScroll: boolean;
  streamingChatId: string | null;  // 新增
}

interface StreamActions {
  setIsStreaming: (v: boolean) => void;
  setStopRequested: (v: boolean) => void;
  setStreamingText: (text: string) => void;
  setAutoScroll: (v: boolean) => void;
  setStreamingChatId: (id: string | null) => void;  // 新增
}
```

### 4. `InputArea.tsx` — handleSend 锁定 chatId

**文件**：`src/components/chat/InputArea.tsx`

- 在 `handleSend` 开头捕获 `chatId`
- 所有 `addMessage` 调用传入 `chatId`
- 流式开始时设置 `setStreamingChatId(chatId)`，结束时清除

```typescript
const handleSend = useCallback(async () => {
  const text = inputValue.trim();
  if (!text || isStreaming) return;

  if (!activeChatId) await createChat();

  setInputValue('');
  if (textareaRef.current) {
    textareaRef.current.style.height = 'auto';
  }

  const chatId = useChatStore.getState().activeChatId || activeChatId;
  addMessage('user', text, chatId);  // ← 传入 chatId

  setIsStreaming(true);
  setStopRequested(false);
  setStreamingChatId(chatId);  // ← 新增：标记正在回复的对话

  let fullResp = '';
  try {
    const chat = useChatStore.getState().chats.find(c => c.id === chatId);  // ← 用 chatId 查找
    const allMsgs = (chat?.messages || []).filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content, ts: m.ts }));
    const msgs = contextLength > 0 ? allMsgs.slice(-contextLength) : [];

    let modelToUse = model;
    if (currentMode === 'expert' && modeConfig.expert?.model) {
      modelToUse = modeConfig.expert.model;
    }

    for await (const chunk of API.stream(msgs, modelToUse)) {
      if (useStreamStore.getState().stopRequested) break;
      fullResp += chunk;
    }

    if (fullResp) {
      addMessage('assistant', fullResp, chatId);  // ← 传入 chatId
    }
  } catch (e: unknown) {
    if (!useStreamStore.getState().stopRequested) {
      showToast('请求失败，请重试', 'error');
      addMessage('assistant', `⚠ ${e instanceof Error ? e.message : 'Error'}`, chatId);  // ← 传入 chatId
    }
  }

  setIsStreaming(false);
  setStreamingChatId(null);  // ← 新增：清除标记
}, [inputValue, isStreaming, activeChatId, createChat, addMessage, setIsStreaming, setStopRequested, setStreamingChatId, model, contextLength, currentMode, modeConfig]);
```

### 5. `ChatArea.tsx` — handleRegenerate 锁定 chatId

**文件**：`src/components/chat/ChatArea.tsx`

- 在 `handleRegenerate` 开头捕获 `chatId`
- 所有 `addMessage` 调用传入 `chatId`
- 流式开始/结束时设置/清除 `streamingChatId`

```typescript
const handleRegenerate = useCallback(async () => {
  const chatId = activeChatId;  // ← 锁定
  const chat = chats.find(c => c.id === chatId);
  if (!chat || isStreaming) return;

  if (chat.messages[chat.messages.length - 1]?.role === 'assistant') {
    chat.messages.pop();
    useChatStore.setState({ chats: [...useChatStore.getState().chats] });
    await saveChat(chat);
  }

  const allMsgs = chat.messages.map(m => ({ role: m.role, content: m.content, ts: m.ts }));
  const msgs = contextLength > 0 ? allMsgs.slice(-contextLength) : [];
  const modelToUse = chat.model || model;

  setIsStreaming(true);
  setStopRequested(false);
  setStreamingChatId(chatId);  // ← 新增

  let fullResp = '';
  try {
    for await (const chunk of API.stream(msgs, modelToUse)) {
      if (useStreamStore.getState().stopRequested) break;
      fullResp += chunk;
    }
    if (fullResp) addMessage('assistant', fullResp, chatId);  // ← 传入 chatId
  } catch (e: unknown) {
    if (!useStreamStore.getState().stopRequested) {
      showToast('重新生成失败', 'error');
      addMessage('assistant', `⚠ ${e instanceof Error ? e.message : 'Error'}`, chatId);  // ← 传入 chatId
    }
  }
  setIsStreaming(false);
  setStreamingChatId(null);  // ← 新增
}, [chats, activeChatId, isStreaming, contextLength, model, addMessage, setIsStreaming, setStopRequested, setStreamingChatId, showToast]);
```

### 6. `Sidebar.tsx` — ChatItem 添加转圈指示器

**文件**：`src/components/layout/Sidebar.tsx`

- 在 `Sidebar` 中读取 `streamingChatId`
- 传递 `isStreaming` prop 给 `ChatItem`
- `ChatItem` 在标题旁显示旋转图标（使用 lucide-react 的 `Loader2` + CSS `animate-spin`）

**Sidebar 组件变更**：
```typescript
const streamingChatId = useStreamStore(s => s.streamingChatId);
```

ChatItem 调用时增加 `isStreaming` prop：
```typescript
<ChatItem
  key={chat.id}
  chat={chat}
  isActive={chat.id === activeChatId}
  isStreaming={chat.id === streamingChatId}  // ← 新增
  onSwitch={handleSwitchChat}
  ...
/>
```

**ChatItem 组件变更**：
- Props 增加 `isStreaming: boolean`
- 在 `ci-icon` 区域，当 `isStreaming` 为 true 时，用 `Loader2` 图标替换 `MessageSquare`，并添加 `animate-spin` 类

```tsx
{isStreaming ? (
  <Loader2 size={13} className="animate-spin" />
) : (
  <MessageSquare size={13} />
)}
```

---

## 修改文件清单

| 文件 | 修改内容 |
|------|----------|
| `src/status/chatStore.ts` | `addMessage` 增加 `chatId?` 参数 |
| `src/status/streamStore.ts` | 新增 `streamingChatId` 状态和 `setStreamingChatId` action |
| `src/hooks/useChats.ts` | `addMessage` 透传 `chatId?` 参数，IDB查找也用 chatId |
| `src/components/chat/InputArea.tsx` | `handleSend` 锁定 chatId，传入 addMessage，设置 streamingChatId |
| `src/components/chat/ChatArea.tsx` | `handleRegenerate` 锁定 chatId，传入 addMessage，设置 streamingChatId |
| `src/components/layout/Sidebar.tsx` | 读取 streamingChatId，ChatItem 显示转圈 Loader2 |

---

## 验证步骤

1. `npx tsc --noEmit` 零错误
2. `npm run lint` 零错误
3. 功能验证：
   - 在对话A发送消息，AI回复期间切换到对话B，确认AI回复仍写入对话A
   - 在对话A发送消息，侧边栏对话A的图标应显示旋转的 Loader2
   - AI回复结束后，旋转图标消失，恢复为 MessageSquare
   - 重新生成功能同样验证消息写入正确对话
