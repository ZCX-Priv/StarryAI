# 消息持久化缺陷修复计划

## 摘要
修复在 AI 回复流式生成过程中刷新页面导致回复内容变为空消息的问题。采用"双保险"机制：**流式内容实时持久化到 IndexedDB** + **消息状态标记与中断检测**。

## 现状分析

### 问题根因
1. `addMessage('assistant', '', chatId)` 创建空 assistant 消息时会立即 `saveChat` → **空内容被持久化到 IndexedDB**
2. `updateMessageContent` **只更新内存中的 Zustand store，不写 IndexedDB**
3. 流式回复正常结束/异常/停止时才会调用 `saveChat`
4. 刷新页面后从 IndexedDB 加载 → 得到的是创建时的空内容 → **表现为空消息**

### 关键代码路径
- **空消息创建与持久化**: `InputArea.tsx:330` → `useChats.addMessage` → `IDBStore.saveChat`
- **内容更新（不写磁盘）**: `InputArea.tsx:342` → `useChats.updateMessageContent` → 仅修改 Zustand
- **最终持久化**: `InputArea.tsx:371` / `ChatArea.tsx:130` → `saveChat`
- **数据恢复**: `useStore.ts:73-79` → 从 IndexedDB 读取并恢复

### 风险点
- `streamStore` 的流式状态完全在内存中，刷新后全部丢失
- `requestAnimationFrame` 节流导致最后几个 chunk 可能未及时 flush
- 没有任何机制识别"刷新时未完成的流式消息"

## 方案设计（双保险）

### 保险一：流式内容实时持久化
修改 `useChats.ts` 的 `updateMessageContent`，在更新内存后立即触发 `IDBStore.saveChat`（**不 await**，异步执行不阻塞 UI 渲染）。

**为什么可靠？**
- `requestAnimationFrame` 已将 flush 频率限制到合理范围（取决于 SSE chunk 接收频率，通常每秒数次到十数次）
- IndexedDB 写入是异步事务，现代浏览器中性能足够
- 不 await 意味着不会阻塞流式渲染的主线程
- 从收到 chunk 到用户手动刷新通常有数百毫秒以上，写入通常已完成

### 保险二：消息状态标记 + 中断恢复
引入 `Message.status` 字段，在页面初始化时自动检测并标记中断的消息。

**状态流转：**
- `streaming` → 流式生成开始（创建 assistant 消息时）
- `completed` → 流正常结束
- `stopped` → 用户手动停止
- `error` → 请求出错
- `interrupted` → 刷新页面后，对原本处于 `streaming` 状态的消息自动降级

**为什么需要？**
- 覆盖 IndexedDB 异步写入未完成的最极端情况
- 让用户明确知道哪些消息是在生成过程中被中断的，避免误以为内容完整
- 为将来可能的"断点续传/重新生成"功能打下基础

## 具体改动

### 1. `src/types/index.ts`
给 `Message` 接口添加可选的 `status` 字段：

```typescript
export type MessageStatus = 'streaming' | 'completed' | 'stopped' | 'error' | 'interrupted';

export interface Message {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  rendered?: string;
  ts: number;
  stopped?: boolean; // 保留以兼容已有逻辑
  status?: MessageStatus;
}
```

### 2. `src/status/chatStore.ts`
- 修改 `addMessage` 签名，支持传入可选的 `status`
- 新增 `setMessageStatus(chatId, messageId, status)` action

```typescript
addMessage: (role, content, chatId, status?) => {
  // ...newMsg 增加 status 字段
}

setMessageStatus: (chatId, messageId, status) => {
  // 遍历找到对应消息，更新 status
}
```

### 3. `src/hooks/useChats.ts`
- `addMessage`：透传 `status` 参数
- `updateMessageContent`：更新内存后**立即触发 `IDBStore.saveChat`（不 await）**
- 新增 `setMessageStatus` 方法，更新 status 后 saveChat

```typescript
const updateMessageContent = useCallback((chatId: string, messageId: string, content: string) => {
  useChatStore.getState().updateMessageContent(chatId, messageId, content);
  const chat = useChatStore.getState().chats.find(c => c.id === chatId);
  if (chat) {
    IDBStore.saveChat(chat).catch(() => {}); // 不阻塞、不抛错
  }
}, []);
```

### 4. `src/components/chat/InputArea.tsx`
在 `handleSend` 的流式生命周期中管理消息状态：

| 阶段 | 操作 |
|------|------|
| 创建 assistant 消息 | `addMessage('assistant', '', chatId, 'streaming')` |
| 流正常结束 | `setMessageStatus(chatId, assistantMsgId, 'completed')` |
| 用户手动停止 | `setMessageStatus(chatId, assistantMsgId, 'stopped')` + `stopMessage` |
| 请求出错 | `setMessageStatus(chatId, assistantMsgId, 'error')` |
| 空响应清理 | 无需 status，直接删除消息 |

### 5. `src/components/chat/ChatArea.tsx`
在 `handleRegenerate` 中同步应用与 `InputArea.tsx` 相同的状态管理逻辑。

### 6. `src/hooks/useStore.ts`
在数据加载完成后，遍历所有 chats，将 `status === 'streaming'` 的消息降级为 `'interrupted'`，并写回 IndexedDB：

```typescript
const migratedChats = (chats || []).map((chat: Chat) => {
  let modified = false;
  const messages = chat.messages.map(msg => {
    if (msg.status === 'streaming') {
      modified = true;
      return { ...msg, status: 'interrupted' as MessageStatus };
    }
    return msg;
  });
  if (modified) {
    IDBStore.saveChat({ ...chat, messages }).catch(() => {});
  }
  return { ...chat, messages: messages.map(msg => msg.id ? msg : { ...msg, id: crypto.randomUUID() }) };
});
```

### 7. `src/components/chat/MessageBubble.tsx`（可选 UX 增强）
在 assistant 消息渲染中，对 `status === 'interrupted'` 的消息追加"生成被中断"的轻量提示：

```typescript
{status === 'interrupted' && (
  <div className="msg-interrupted-hint">生成被中断，内容可能不完整</div>
)}
```

## 假设与决策

1. **不引入 debounce/throttle 到持久化层**：
   - `requestAnimationFrame` 已经在消费端做了节流
   - debounce 会引入"等待期内刷新仍丢失内容"的竞态窗口，降低稳妥性
   - IndexedDB 异步写入开销在实测中可接受

2. **`updateMessageContent` 中不 await saveChat**：
   - 保证流式渲染不被阻塞
   - 即使某次 saveChat 失败，后续 flush 仍会再次触发保存
   - `.catch(() => {})` 防止未处理的 Promise rejection

3. **`stopped` 与 `status: 'stopped'` 并存**：
   - 保留原有的 `stopped` 布尔字段以兼容现有 UI 逻辑（如显示"手动终止输出"提示）
   - `status` 字段专注于表达消息的生命周期状态

4. **不实现自动重新生成**：
   - 范围限定为"防止空消息 + 标记中断状态"
   - 自动重新生成涉及复杂的上下文重建和用户体验决策，超出当前 issue 范围

## 验证步骤

1. **功能验证**：
   - 发送一条消息，在 AI 回复过程中（看到打字动画或部分文字后）刷新页面
   - 刷新后检查该 assistant 消息是否保留了刷新前已显示的内容
   - 检查该消息是否带有"生成被中断"的提示或 `interrupted` 状态标记

2. **边界验证**：
   - 在 AI 回复刚开始、内容为空时刷新 → 应保留空消息但标记为 `interrupted`
   - 正常等待 AI 回复完成后刷新 → 消息应标记为 `completed`，内容完整
   - 点击停止按钮后刷新 → 消息应标记为 `stopped`，内容保留
   - 重新生成功能中中断刷新 → 行为应与正常发送一致

3. **性能验证**：
   - 打开 DevTools 的 Performance 面板，观察流式回复期间主线程是否出现明显卡顿
   - 确认 `updateMessageContent` 的 IndexedDB 写入不会导致 UI 掉帧

4. **回归验证**：
   - 检查旧数据（没有 `status` 字段的消息）是否正常显示
   - 运行 `npm run lint` 和 `npx tsc --noEmit` 确保无类型错误
