# 对话 UUID 状态隔离方案

## 概述

当前对话 ID 使用 `Date.now().toString(36) + Math.random().toString(36).slice(2)` 生成，存在碰撞风险；且消息数组直接 mutate（push/pop），违反 Zustand 不可变更新原则，导致状态隔离不可靠。本方案将：

1. 使用 `crypto.randomUUID()` 为每个对话生成标准 UUID
2. 修复所有消息数组的直接 mutate 操作，改为不可变更新
3. 为 Message 添加 `id` 字段，用 UUID 替代数组索引作为 React key

## 当前状态分析

### ID 生成（chatStore.ts:32）
```ts
const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
```
- 同毫秒创建多个 Chat 时碰撞风险高
- 长度不确定，非标准格式

### 消息直接 mutate 问题
- `chatStore.ts:66` — `chat.messages.push(...)` 直接修改引用
- `ChatArea.tsx:82` — `chat.messages.pop()` 直接修改引用
- 两者都通过 `set({ chats: [...get().chats] })` 仅浅拷贝外层数组触发更新

### Message 无独立 ID
- `MessageList.tsx:39` — `key={i}` 使用数组索引，消息删除/重排时可能导致 React 渲染异常

## 具体改动

### 1. 修改 `src/types/index.ts` — Message 添加 id 字段

```ts
export interface Message {
  id: string;  // 新增：UUID
  role: 'system' | 'user' | 'assistant';
  content: string;
  rendered?: string;
  ts: number;
}
```

### 2. 修改 `src/status/chatStore.ts` — UUID 生成 + 不可变更新

**createChat**：改用 `crypto.randomUUID()`
```ts
const id = crypto.randomUUID();
```

**addMessage**：不可变更新，为 Message 生成 UUID
```ts
addMessage: (role, content, chatId) => {
  const targetId = chatId || get().activeChatId;
  const newMsg: Message = {
    id: crypto.randomUUID(),
    role,
    content,
    rendered: content,
    ts: Date.now(),
  };
  set({
    chats: get().chats.map(c =>
      c.id === targetId
        ? {
            ...c,
            messages: [...c.messages, newMsg],
            title: c.messages.length === 0 && role === 'user'
              ? content.slice(0, 20) + (content.length > 20 ? '…' : '')
              : c.title,
          }
        : c
    ),
  });
},
```

**renameChat**：不可变更新
```ts
renameChat: (chatId, newTitle) => {
  set({
    chats: get().chats.map(c =>
      c.id === chatId ? { ...c, title: newTitle || '新对话' } : c
    ),
  });
},
```

### 3. 修改 `src/components/chat/ChatArea.tsx` — 不可变 regenerate

将 `chat.messages.pop()` 改为不可变方式：
```ts
const handleRegenerate = useCallback(async () => {
  const chatId = activeChatId;
  const chat = chats.find(c => c.id === chatId);
  if (!chat || !chatId || isStreamingThisChat) return;

  let msgs = chat.messages;
  if (msgs[msgs.length - 1]?.role === 'assistant') {
    msgs = msgs.slice(0, -1);
    useChatStore.setState({
      chats: useChatStore.getState().chats.map(c =>
        c.id === chatId ? { ...c, messages: msgs } : c
      ),
    });
    await saveChat({ ...chat, messages: msgs });
  }

  // 后续流式请求使用 msgs（已移除最后 assistant 消息）
  const allMsgs = msgs.map(m => ({ role: m.role, content: m.content, ts: m.ts }));
  // ... 其余逻辑不变
}, [...]);
```

### 4. 修改 `src/components/chat/MessageList.tsx` — 使用 message.id 作为 key

```tsx
{messages.map((msg, i) => (
  <MessageBubble
    key={msg.id}  // 替换 key={i}
    role={msg.role}
    content={msg.content}
    isStreaming={isStreamingThisChat && i === messages.length - 1 && msg.role === 'assistant'}
  />
))}
```

### 5. 修改 `src/components/chat/MessageActions.tsx` — 适配不可变更新

当前 `handleCopy` 仅读取，无需改动。但需确认其他引用处。

### 6. 数据迁移 — `src/services/migration.ts` 或 `src/App.tsx`

为已有的 Message 数据补充 `id` 字段。在应用初始化加载 chats 时：
```ts
// 加载历史 chats 时，为缺少 id 的 Message 补充 UUID
function migrateMessages(chats: Chat[]): Chat[] {
  return chats.map(chat => ({
    ...chat,
    messages: chat.messages.map(msg =>
      msg.id ? msg : { ...msg, id: crypto.randomUUID() }
    ),
  }));
}
```

此迁移逻辑应在 `useChats` 初始化加载或 `App.tsx` 的初始化流程中执行。

## 假设与决策

| 决策 | 选择 | 理由 |
|------|------|------|
| UUID 生成方式 | `crypto.randomUUID()` | 浏览器原生 API，无需额外依赖，符合 RFC4122 v4 |
| 是否引入 Map 替代数组 | 否 | 当前规模下 O(n) 查找不是瓶颈，改动过大 |
| 是否拆分 Store 为 per-chat | 否 | 当前架构所有 chats 在一个 Store，拆分改动过大且不必要 |
| Message.id 是否持久化 | 是 | 添加到 Message 接口后，IndexedDB 保存时自动包含 |
| 迁移策略 | 懒迁移 | 加载时检测缺失 id 则补充，无需升级 DB 版本 |

## 验证步骤

1. `npx tsc --noEmit` — 零类型错误
2. `npm run lint` — 无 ESLint 错误
3. `npm run build` — 构建成功
4. 手动测试：
   - 新建对话 → 确认 chat.id 为 UUID 格式
   - 发送消息 → 确认 message.id 为 UUID 格式
   - 切换对话 → 确认消息不串扰
   - 重新生成 → 确认最后一条 assistant 消息被正确移除
   - 刷新页面 → 确认历史消息加载正常（含迁移后的 id）
