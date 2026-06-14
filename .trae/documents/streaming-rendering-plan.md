# 流式渲染实现计划

## 摘要

当前 API 层已实现 SSE 流式读取（`API.stream` 是 AsyncGenerator），但 UI 层只在流结束后一次性写入完整响应。用户在流式传输期间只看到打字指示器（三个跳动的点），而非逐步增长的文本。

**目标**：让 AI 回复逐字/逐块显示在屏幕上，实现真正的流式渲染。

## 现状分析

### 当前流程
```
用户输入 → addMessage('user') → API.stream() → 拼接所有chunk → addMessage('assistant', fullResp) → 显示
                                                                    ↑ 流期间只显示打字指示器
```

### 核心问题
1. **chatStore 没有 `updateMessageContent`**：只有 `addMessage`，无法增量更新消息内容
2. **流结束后才写入消息**：`handleSend`/`handleRegenerate` 中 `fullResp += chunk` 后才 `addMessage`
3. **streamStore.streamingText 是死代码**：定义了但从未被调用
4. **MessageList 显示打字指示器**：而非流式文本
5. **无节流机制**：SSE chunk 可能每帧多个，直接更新 state 会导致过度渲染

## 实现方案

### 核心思路
- 流开始时创建空的 assistant 消息，获取其 ID
- 流期间用 `requestAnimationFrame` 节流，每帧最多更新一次 chatStore
- 流结束时最终持久化到 IndexedDB

### 修改后的流程
```
用户输入 → addMessage('user') → addMessage('assistant', '') → API.stream()
                                                                      ↓ 每帧
                                                            updateMessageContent(chatId, msgId, 累积文本)
                                                                      ↓ 流结束
                                                            saveChat() → IndexedDB持久化
```

---

## 具体修改

### 1. `src/status/chatStore.ts` — 添加消息更新能力

**修改内容**：
- `addMessage` 返回新消息的 `id`（string）
- 新增 `updateMessageContent(chatId: string, messageId: string, content: string)` action
  - 找到对应 chat → 找到对应 message → 更新 content 和 rendered 字段
  - 使用不可变更新（map 替换）

```typescript
// ChatActions 新增
updateMessageContent: (chatId: string, messageId: string, content: string) => void;

// addMessage 返回值改为 string
addMessage: (role, content, chatId) => {
  // ... 现有逻辑 ...
  const newMsg: Message = { id: crypto.randomUUID(), ... };
  // ... set(...) ...
  return newMsg.id;  // 新增返回
},

// 新增 action
updateMessageContent: (chatId, messageId, content) => {
  set({
    chats: get().chats.map(c =>
      c.id === chatId
        ? {
            ...c,
            messages: c.messages.map(m =>
              m.id === messageId ? { ...m, content, rendered: content } : m
            ),
          }
        : c
    ),
  });
},
```

### 2. `src/hooks/useChats.ts` — 添加 updateMessageContent + 修改 addMessage 返回值

**修改内容**：
- `addMessage` 返回 `Promise<string>`（消息 ID）
- 新增 `updateMessageContent(chatId: string, messageId: string, content: string)` — 仅更新 chatStore，不写 IndexedDB

```typescript
const addMessage = useCallback(async (role, content, chatId?): Promise<string> => {
  const msgId = useChatStore.getState().addMessage(role, content, chatId);
  const targetId = chatId || useChatStore.getState().activeChatId;
  const chat = useChatStore.getState().chats.find(c => c.id === targetId);
  if (chat) await IDBStore.saveChat(chat);
  return msgId;
}, []);

const updateMessageContent = useCallback((chatId: string, messageId: string, content: string) => {
  useChatStore.getState().updateMessageContent(chatId, messageId, content);
}, []);
```

### 3. `src/components/chat/InputArea.tsx` — 流式渲染核心逻辑

**修改 `handleSend`**：

```typescript
const handleSend = useCallback(async () => {
  const text = inputValue.trim();
  if (!text || isStreamingThisChat) return;

  let chatId = activeChatId;
  if (!chatId) {
    const newChat = await createChat();
    chatId = newChat.id;
  }
  if (!chatId) return;

  setInputValue('');
  if (textareaRef.current) textareaRef.current.style.height = 'auto';

  addMessage('user', text, chatId);

  // 流开始：创建空的 assistant 消息
  const assistantMsgId = await addMessage('assistant', '', chatId);

  setStopRequested(chatId, false);
  addStreamingChat(chatId);

  const controller = new AbortController();
  abortControllers.current.set(chatId, controller);

  // 流式渲染：用 rAF 节流
  let accumulated = '';
  let rafId = 0;
  const flushUpdate = () => {
    updateMessageContent(chatId, assistantMsgId, accumulated);
  };

  try {
    const chat = useChatStore.getState().chats.find(c => c.id === chatId);
    const filteredMsgs = (chat?.messages || []).filter(m => m.role !== 'system' && m.id !== assistantMsgId);
    const msgs = contextLength > 0 ? filteredMsgs.slice(-contextLength) : [];

    let modelToUse = model;
    if (currentMode === 'expert' && modeConfig.expert?.model) {
      modelToUse = modeConfig.expert.model;
    }

    for await (const chunk of API.stream(msgs, modelToUse, chatId, controller.signal)) {
      if (useStreamStore.getState().isStopRequested(chatId)) break;
      accumulated += chunk;
      if (!rafId) {
        rafId = requestAnimationFrame(() => { rafId = 0; flushUpdate(); });
      }
    }

    // 流结束：最终刷新 + 持久化
    cancelAnimationFrame(rafId);
    if (accumulated) {
      updateMessageContent(chatId, assistantMsgId, accumulated);
      // 持久化到 IndexedDB
      const finalChat = useChatStore.getState().chats.find(c => c.id === chatId);
      if (finalChat) await saveChat(finalChat);
    } else {
      // 空响应：移除空的 assistant 消息
      useChatStore.setState({
        chats: useChatStore.getState().chats.map(c =>
          c.id === chatId ? { ...c, messages: c.messages.filter(m => m.id !== assistantMsgId) } : c
        ),
      });
      const finalChat = useChatStore.getState().chats.find(c => c.id === chatId);
      if (finalChat) await saveChat(finalChat);
    }
  } catch (e: unknown) {
    cancelAnimationFrame(rafId);
    if (!useStreamStore.getState().isStopRequested(chatId)) {
      showToast('请求失败，请重试', 'error');
      updateMessageContent(chatId, assistantMsgId, `⚠ ${e instanceof Error ? e.message : 'Error'}`);
      const finalChat = useChatStore.getState().chats.find(c => c.id === chatId);
      if (finalChat) await saveChat(finalChat);
    }
  }

  abortControllers.current.delete(chatId);
  if (useStreamStore.getState().streamingChatIds.has(chatId)) {
    removeStreamingChat(chatId);
  }
}, [/* deps + updateMessageContent, saveChat */]);
```

### 4. `src/components/chat/ChatArea.tsx` — handleRegenerate 同样改造

与 `handleSend` 相同的流式渲染逻辑：
- 删除最后一条 assistant 消息后，创建新的空 assistant 消息
- 流期间用 rAF 节流更新
- 流结束持久化

### 5. `src/components/chat/MessageList.tsx` — 移除打字指示器

**修改内容**：
- 删除 typing-indicator 的 div（因为流式文本已实时显示）
- 当最后一条 assistant 消息内容为空且正在流式传输时，显示一个简单的加载提示（可选）

```typescript
// 移除这段代码：
{isStreamingThisChat && (
  <div className="msg-row ai">
    <div className="ai-msg-content">
      <div className="typing-indicator">...</div>
    </div>
  </div>
)}
```

### 6. `src/components/chat/MessageBubble.tsx` — 添加流式光标

**修改内容**：
- 当 `isStreaming` 为 true 且有内容时，在内容末尾显示闪烁光标
- 当 `isStreaming` 为 true 且内容为空时，显示打字指示器（从 MessageList 移过来）

```typescript
{isStreaming && !mainContent && (
  <div className="typing-indicator">
    <div className="td"></div><div className="td"></div><div className="td"></div>
  </div>
)}
{mainContent && <MarkdownRenderer content={mainContent} />}
{isStreaming && mainContent && <span className="streaming-cursor" />}
```

### 7. CSS — 添加闪烁光标样式

在 `src/index.css` 中添加：

```css
.streaming-cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  background: currentColor;
  margin-left: 2px;
  animation: blink 1s step-end infinite;
  vertical-align: text-bottom;
}

@keyframes blink {
  50% { opacity: 0; }
}
```

---

## 假设与决策

1. **节流策略**：使用 `requestAnimationFrame`（~60fps），而非时间节流。rAF 自然与浏览器渲染周期对齐，且避免重复调度
2. **持久化策略**：流期间只更新 chatStore（内存），流结束才写 IndexedDB。避免频繁 I/O
3. **空响应处理**：如果流结束但内容为空，删除之前创建的空 assistant 消息
4. **停止请求处理**：用户点击停止时，保留已接收的部分内容（不再删除）
5. **streamStore.streamingText**：保持现状（死代码），不使用它。直接通过 chatStore 的 `updateMessageContent` 驱动 UI 更新，数据流更简单
6. **Markdown 渲染**：流式期间直接用现有的 `MarkdownRenderer` 渲染不完整文本。react-markdown 本身能处理不完整的 Markdown（未闭合的代码块等会原样显示），无需额外处理

## 验证步骤

1. 发送消息后，AI 回复应逐字/逐块显示在屏幕上
2. 流式期间显示闪烁光标
3. 点击停止按钮后，保留已接收的部分内容
4. 重新生成功能正常工作（流式渲染）
5. 流结束后内容正确持久化到 IndexedDB（刷新页面后仍可见）
6. 思考链（thinking）内容在流式期间正确显示
7. `npm run lint` 和 `npx tsc --noEmit` 通过
