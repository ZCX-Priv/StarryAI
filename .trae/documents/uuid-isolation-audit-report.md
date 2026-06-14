# 对话 UUID 隔离审查报告

## 审查结论：通过 - 对话间 UUID 隔离完整，未发现跨对话污染风险

---

## 一、类型定义层 (`src/types/index.ts`)

| 字段 | 类型 | 用途 | 状态 |
|------|------|------|------|
| `Chat.id` | `string` | 对话唯一标识（UUID） | 通过 |
| `Message.id` | `string` | 消息唯一标识（UUID） | 通过 |
| `Chat.messages` | `Message[]` | 消息内嵌于 Chat 对象 | 通过 |

消息以数组形式内嵌在 Chat 中，天然保证消息归属，不存在跨对话泄露。

---

## 二、Store 层 (`src/status/chatStore.ts`)

| 操作 | UUID 使用 | 状态 |
|------|-----------|------|
| `createChat` | `crypto.randomUUID()` 生成 chat ID | 通过 |
| `addMessage` | `crypto.randomUUID()` 生成 message ID | 通过 |
| `addMessage` | `chatId || get().activeChatId` 定位目标对话 | 通过 |
| `addMessage` | `c.id === targetId` 精确匹配，不可变更新 | 通过 |
| `deleteChat` | `c.id !== id` 过滤删除 | 通过 |
| `switchToChat` | 设置 `activeChatId` | 通过 |
| `renameChat` | `c.id === chatId` 匹配 | 通过 |

所有更新均使用 `chats.map(c => c.id === targetId ? {...} : c)` 不可变模式，只修改目标对话。

---

## 三、组件层

### ChatArea (`src/components/chat/ChatArea.tsx`)
- `chats.find(c => c.id === chatId)` 按 UUID 查找当前对话
- `addMessage('assistant', fullResp, chatId)` 显式传入 chatId
- 重新生成时 `c.id === chatId` 精确定位目标对话

### MessageList (`src/components/chat/MessageList.tsx`)
- `chats.find(c => c.id === activeChatId)` 按 UUID 查找
- `key={msg.id}` 使用消息 UUID 作为 React key

### InputArea (`src/components/chat/InputArea.tsx`)
- `addMessage('user', text, chatId)` 显式传入 chatId
- `chats.find(c => c.id === chatId)` 按 UUID 获取历史消息
- 助手回复也明确传入 `chatId`

### Sidebar (`src/components/layout/Sidebar.tsx`)
- `key={chat.id}` 使用对话 UUID 作为 React key
- `chat.id === activeChatId` 按 UUID 判断活跃状态
- `streamingChatIds.has(chat.id)` 按 UUID 判断流式状态

---

## 四、持久化层

### useStore (`src/hooks/useStore.ts`)
- 第 72-78 行：旧数据迁移，为缺少 `id` 的 Message 补充 `crypto.randomUUID()`
- 从 IDB 恢复 `activeChatId`，保证刷新后正确定位

### storage (`src/services/storage.ts`)
- CHATS objectStore 的 `keyPath` 为 `'id'`，以 UUID 为主键
- `saveChat` / `deleteChat` 均按 UUID 操作

### useChats (`src/hooks/useChats.ts`)
- 所有操作（addMessage/deleteChat/switchToChat/renameChat）均按 chatId 透传

---

## 五、流式状态 (`src/status/streamStore.ts`)

- `streamingChatIds: Set<string>` 按对话 UUID 追踪流式状态
- 不会出现对话 A 的流式指示器显示在对话 B 中

---

## 六、唯一小瑕疵（不影响隔离）

`MessageBubble.tsx` 第 38 行：`<ThinkingBlock key={i} content={part} />` 使用数组索引作为 key，而非唯一标识符。

**影响**：这是 React 最佳实践问题，仅在流式传输中思考块数量变化时可能导致组件状态错位，与对话隔离无关。

---

## 审查汇总

| 审查维度 | 结果 |
|----------|------|
| 每个 Chat 有唯一 UUID | 通过 |
| 每个 Message 有唯一 UUID | 通过 |
| 旧数据迁移补充 UUID | 通过 |
| 切换对话按 Chat ID 过滤消息 | 通过 |
| 添加消息关联正确 Chat UUID | 通过 |
| 无共享可变状态导致跨对话污染 | 通过 |
| React key 使用 UUID | 通过 |
| IndexedDB 按 UUID 隔离 | 通过 |
| 流式状态按对话隔离 | 通过 |

**无需修复，对话 UUID 隔离机制完整可靠。**
