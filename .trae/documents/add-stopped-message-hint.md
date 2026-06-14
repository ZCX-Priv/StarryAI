# 添加手动停止提示计划

## 摘要
在用户手动终止 AI 流式输出后，于被停止的 assistant 消息下方显示一行灰色小字提示「⚫ 手动终止输出」。

## 当前状态分析
- `Message` 接口（`src/types/index.ts`）没有标记消息是否被手动停止的字段。
- 流式输出在 `InputArea.tsx`（发送消息）和 `ChatArea.tsx`（重新生成）中分别管理，停止逻辑通过 `AbortController` + `streamStore.stopRequestedChatIds` 双层实现。
- 用户点击停止后，若已有累积内容，消息会被保留；若为空则移除。
- `MessageList` 遍历 `messages` 数组渲染 `MessageBubble`，目前没有在任何位置显示「已停止」状态。
- 项目 CSS 变量中 `--text3`（`#5c5c72` / `#7a7a96`）适合作为灰色提示文字颜色。

## 拟议变更

### 1. `src/types/index.ts`
在 `Message` 接口新增可选字段 `stopped?: boolean`，用于标记该条 assistant 消息是否被用户手动终止。

```ts
export interface Message {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  rendered?: string;
  ts: number;
  stopped?: boolean; // 新增
}
```

### 2. `src/status/chatStore.ts`
新增 `stopMessage` action，将指定消息标记为 `stopped: true`。

- 在 `ChatActions` 接口添加：`stopMessage: (chatId: string, messageId: string) => void;`
- 在 store 实现中添加：
  ```ts
  stopMessage: (chatId, messageId) => {
    set({
      chats: get().chats.map(c =>
        c.id === chatId
          ? {
              ...c,
              messages: c.messages.map(m =>
                m.id === messageId ? { ...m, stopped: true } : m
              ),
            }
          : c
      ),
    });
  },
  ```

### 3. `src/hooks/useChats.ts`
暴露 `stopMessage` 方法供组件使用。

```ts
const stopMessage = useCallback((chatId: string, messageId: string) => {
  useChatStore.getState().stopMessage(chatId, messageId);
}, []);

return {
  // ...existing
  stopMessage,
};
```

### 4. `src/components/chat/InputArea.tsx`
在发送消息的流式处理 `catch` 块中，当检测到用户主动停止且消息有内容时，调用 `stopMessage` 标记该消息。

修改位置：`handleSend` 内的 `catch (e: unknown)` 块（当前第 379–392 行）。

变更逻辑：
```tsx
} catch (e: unknown) {
  cancelAnimationFrame(rafId);
  if (!useStreamStore.getState().isStopRequested(chatId)) {
    showToast('请求失败，请重试', 'error');
    updateMessageContent(chatId, assistantMsgId, `⚠ ${e instanceof Error ? e.message : 'Error'}`);
    const finalChat = useChatStore.getState().chats.find(c => c.id === chatId);
    if (finalChat) await saveChat(finalChat);
  } else {
    if (accumulated) {
      updateMessageContent(chatId, assistantMsgId, accumulated);
    }
    stopMessage(chatId, assistantMsgId); // 新增：标记为已停止
    const finalChat = useChatStore.getState().chats.find(c => c.id === chatId);
    if (finalChat) await saveChat(finalChat);
  }
}
```

注意：若 `accumulated` 为空，消息会在前面的 `if/else` 中被移除，此时无需调用 `stopMessage`。

### 5. `src/components/chat/ChatArea.tsx`
在重新生成的流式处理 `catch` 块中，做同样的 `stopMessage` 标记。

修改位置：`handleRegenerate` 内的 `catch (e: unknown)` 块（当前第 138–150 行）。

变更逻辑与 InputArea 类似：在 `isStopRequested` 分支且 `accumulated` 有内容时，先 `updateMessageContent` 再 `stopMessage`。

### 6. `src/components/chat/MessageList.tsx`
在消息列表渲染时，对被标记为 `stopped` 的 assistant 消息，在其 `MessageBubble` 之后插入提示元素。

修改 `messages.map` 部分：

```tsx
{messages.map((msg, i) => (
  <React.Fragment key={msg.id}>
    <MessageBubble
      role={msg.role}
      content={msg.content}
      isStreaming={isStreamingThisChat && i === messages.length - 1 && msg.role === 'assistant'}
    />
    {msg.role === 'assistant' && msg.stopped && (
      <div className="msg-stopped-hint">
        <span className="stopped-dot" />
        手动终止输出
      </div>
    )}
  </React.Fragment>
))}
```

同时需要确保顶部的 `import { useMemo } from 'react';` 保留，若需引入 `React.Fragment` 可直接使用 `<>` 语法，无需额外 import。

### 7. `src/index.css`
添加提示元素的样式。

```css
.msg-stopped-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 0 6px;
  font-size: 12px;
  color: var(--text3);
  margin: 0;
}
.stopped-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text3);
}
```

## 假设与决策
- **假设**：用户希望该提示在消息被停止后立即出现，并持久化保存（因为 `stopped` 字段会随 Chat 存入 IndexedDB）。若用户后续继续对话，提示会始终保留在被停止的消息下方。
- **决策**：不修改 `MessageActions`（重新生成/复制按钮）的位置逻辑，提示仅插入在 `MessageBubble` 与下一条消息之间，不会影响现有操作按钮的显示。
- **决策**：仅对 `accumulated` 有内容的 assistant 消息标记 `stopped`。空响应被移除，自然不会有提示。
- **决策**：使用 `--text3` 作为文字/圆点颜色，与现有灰色次要文字保持一致。

## 验证步骤
1. 运行 `npm run lint` 检查无 ESLint 错误。
2. 运行 `npx tsc --noEmit` 检查无 TypeScript 类型错误。
3. 在浏览器中测试：
   - 发送一条消息，在 AI 流式回复过程中点击停止按钮。
   - 确认被停止的消息下方出现灰色小字「⚫ 手动终止输出」。
   - 刷新页面后，提示仍然保留（验证持久化）。
   - 测试重新生成时手动停止，同样出现提示。
   - 测试在 AI 尚未输出任何内容时立即停止，确认空消息被移除且没有残留提示。
