# 计划：侧栏"新对话"按钮改为显示空聊天界面

## 摘要
将侧栏"新对话"按钮的行为从"立即创建 Chat 对象并存入 IndexedDB"改为"仅将 activeChatId 设为 null，显示空聊天界面"，真正的 Chat 对象延迟到用户发送第一条消息时才创建。

## 当前状态分析
- **Sidebar.tsx** 第22-25行：`handleNewChat` 调用 `createChat()`，立即创建 Chat 对象
- **chatStore.ts** 第31-45行：`createChat()` 生成 Chat 对象、插入 chats 数组、设为 activeChatId、切换页面
- **useChats.ts** 第10-15行：`createChat()` 还会将 Chat 持久化到 IndexedDB
- **InputArea.tsx** 第312行：`if (!activeChatId) await createChat()` — 发消息时如果没有活跃对话才创建（懒创建逻辑已存在）
- **MessageList.tsx** 第21行：`messages = activeChat?.messages || []`，第23行：当 messages 为空时显示 EmptyState
- 当 `activeChatId` 为 `null` 时，`activeChat` 为 `undefined`，`messages` 为 `[]`，MessageList 已经会显示空状态

## 提议变更

### 1. `src/components/layout/Sidebar.tsx`
- `handleNewChat` 不再调用 `createChat()`，改为调用 `chatStore.setActiveChatId(null)` + `uiStore.setCurrentPage('chat')`
- 移除对 `useChats` 中 `createChat` 的依赖（如果不再需要）
- 移动端仍需关闭侧栏

```typescript
const handleNewChat = useCallback(() => {
  useChatStore.getState().setActiveChatId(null);
  useUiStore.getState().setCurrentPage('chat');
  if (window.innerWidth <= 680) setMobileOpen(false);
}, []);
```

### 2. `src/hooks/useChats.ts`
- `createChat` 方法保持不变（InputArea 发送消息时仍需使用）
- 无需修改

### 3. `src/status/chatStore.ts`
- 无需修改，`setActiveChatId(null)` 已支持
- `createChat` 保持不变，供 InputArea 懒创建使用

### 4. `src/components/chat/InputArea.tsx`
- 第312行 `if (!activeChatId) await createChat()` 逻辑已正确，无需修改
- 发送消息时如果 activeChatId 为 null，会自动创建 Chat 对象

### 5. `src/components/chat/MessageList.tsx`
- 无需修改，当 activeChatId 为 null 时已显示 EmptyState

## 假设与决策
- 不需要清除 IndexedDB 中的 `activeChatId` 配置，因为下次发消息创建新 Chat 后会自动保存新的 activeChatId
- 侧栏对话列表不会出现"新对话"项（因为 Chat 对象尚未创建），这是期望行为
- 如果用户点击"新对话"后又点击侧栏某个历史对话，activeChatId 会从 null 变为该对话 ID，不会产生副作用

## 验证步骤
1. 点击"新对话"按钮 → 侧栏不出现新对话项，聊天区显示空状态
2. 在空状态下输入消息并发送 → 自动创建 Chat 对象，侧栏出现新对话项，消息正常发送
3. 点击"新对话"后切换到历史对话 → 正常切换，不产生空对话
4. 刷新页面后 → 恢复上次的 activeChatId，不会停留在 null 状态
5. 运行 `npm run lint` 和 `npx tsc --noEmit` 确认无错误
