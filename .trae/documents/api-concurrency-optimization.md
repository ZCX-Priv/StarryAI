# API 并发请求性能优化计划

## 问题总结

多个对话同时请求时互相阻塞，核心原因：

1. **`stopRequested` 是全局单一布尔值** — 停止一个聊天的流式请求会终止所有正在进行的流式请求
2. **无 AbortController** — `reader.cancel()` 只停止客户端读取，服务端继续生成浪费资源；`fetchAPI` 完全不可取消
3. **流式文本不实时渲染** — `fullResp` 是局部变量，只在流结束后才写入 store，用户看不到逐字输出

## 当前状态分析

### 请求流程
```
用户点击发送 → InputArea.handleSend()
  → setStopRequested(false)          // 重置全局停止标志（影响所有聊天！）
  → addStreamingChat(chatId)         // 标记此聊天正在流式
  → for await (API.stream(msgs))     // 消费 AsyncGenerator
      → streamAPI 内部 fetch()       // 无 AbortController
      → reader.read() 循环           // 每次迭代检查全局 stopRequested
      → fullResp += chunk            // 累积到局部变量
  → addMessage('assistant', fullResp) // 流结束后一次性写入 store
  → removeStreamingChat(chatId)      // 移除流式标记
```

### 关键文件
- `src/services/api.ts` — API 请求核心，streamAPI 和 fetchAPI
- `src/status/streamStore.ts` — 流式状态管理，stopRequested 全局标志
- `src/components/chat/InputArea.tsx` — 发送逻辑，handleSend/handleStop
- `src/components/chat/ChatArea.tsx` — 重新生成逻辑，handleRegenerate

## 修改方案

### 1. streamStore: stopRequested 改为按 chatId 隔离

**文件**: `src/status/streamStore.ts`

- 将 `stopRequested: boolean` 改为 `stopRequestedChatIds: Set<string>`
- `setStopRequested(chatId, v: boolean)` — 设置指定聊天的停止标志
- 新增 `isStopRequested(chatId: string): boolean` — 查询指定聊天是否被停止
- 保留 `streamingChatIds` 和 `streamingText`（按 chatId 隔离）不变

```typescript
interface StreamState {
  stopRequestedChatIds: Set<string>;  // 替代 stopRequested
  streamingText: string;
  autoScroll: boolean;
  streamingChatIds: Set<string>;
}

interface StreamActions {
  setStopRequested: (chatId: string, v: boolean) => void;
  isStopRequested: (chatId: string) => boolean;
  // ... 其余不变
}
```

### 2. api.ts: 引入 AbortController，按 chatId 检查停止

**文件**: `src/services/api.ts`

- `streamAPI` 新增 `chatId` 参数和 `signal?: AbortSignal` 参数
- 内部用 `signal` 替代全局 `stopRequested` 检查
- 当 `signal.aborted` 或 `stopRequestedChatIds.has(chatId)` 时终止流
- `fetchAPI` 同样新增 `signal` 参数
- 取消时调用 `reader.cancel()` + `controller.abort()` 真正终止网络连接

```typescript
async function* streamAPI(
  msgs: Message[],
  model?: string,
  chatId?: string,
  signal?: AbortSignal
): AsyncGenerator<string, void, unknown> {
  // fetch 时传入 signal
  const r = await fetch(url, { ...opts, signal });
  // 循环中检查 signal.aborted 或按 chatId 的停止标志
  while (true) {
    if (signal?.aborted || (chatId && useStreamStore.getState().isStopRequested(chatId))) {
      try { reader.cancel(); } catch {}
      return;
    }
    // ...
  }
}
```

### 3. InputArea.tsx: 创建 AbortController，按 chatId 停止

**文件**: `src/components/chat/InputArea.tsx`

- `handleSend` 中创建 `AbortController`，将 `signal` 传给 `API.stream`
- 用 `useRef<Map<string, AbortController>>` 存储每个 chatId 对应的 controller
- `handleStop` 改为 `setStopRequested(activeChatId, true)` + `controller.abort()`
- 流结束后清理对应 chatId 的 controller

### 4. ChatArea.tsx: 重新生成同样使用 AbortController

**文件**: `src/components/chat/ChatArea.tsx`

- `handleRegenerate` 中同样创建 `AbortController`
- 传入 `chatId` 和 `signal` 给 `API.stream`
- 停止逻辑与 InputArea 一致

### 5. 流式文本实时渲染（可选增强）

**文件**: `src/status/streamStore.ts`, `src/components/chat/InputArea.tsx`, `src/components/chat/ChatArea.tsx`

- 将 `streamingText` 改为 `streamingTexts: Map<string, string>`（按 chatId 隔离）
- 在 `for await` 循环中，每收到 chunk 就更新对应 chatId 的 streamingText
- MessageList 组件读取当前 chatId 的 streamingText 实时显示
- 流结束后将 streamingText 写入 addMessage，并清除对应 chatId 的 streamingText

> 注：此改动涉及 UI 渲染逻辑较多，可作为第二阶段优化。第一阶段先解决并发阻塞问题。

## 实施步骤

1. 修改 `streamStore.ts`：stopRequested 改为按 chatId 隔离
2. 修改 `api.ts`：streamAPI/fetchAPI 增加 chatId + signal 参数
3. 修改 `InputArea.tsx`：创建 AbortController，按 chatId 停止
4. 修改 `ChatArea.tsx`：handleRegenerate 同步修改
5. 运行 `npm run lint` 和 `npx tsc --noEmit` 验证

## 假设与决策

- **假设**：浏览器对同一域名的 HTTP 并发连接数（通常6个）不是瓶颈，真正的问题是客户端逻辑层面的阻塞
- **决策**：第一阶段只解决并发阻塞（stopRequested 全局 + 无 AbortController），流式实时渲染作为后续优化
- **决策**：streamAPI 的 chatId 参数设为可选，保持向后兼容
