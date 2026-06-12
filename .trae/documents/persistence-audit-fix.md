# 持久化缺失全面审计与修复计划

## 审计结论

在 `SettingsDialog.jsx` 修复之后，项目中仍存在 **5 处同类问题**（Zustand Store 直接调用，缺少 IDBStore 持久化）。另外 Chat 相关操作（createChat/addMessage/deleteChat/renameChat/switchToChat）也存在持久化缺失，但这是**系统性设计问题**，需要更谨慎处理。

## 需要修复的 5 处问题

### 1. ModeSelector.jsx — setCurrentMode 未持久化

**文件**: `src/components/chat/ModeSelector.jsx` 行 76
**问题**: `setCurrentMode(modeId)` 仅更新内存
**修复**: 引入 `IDBStore`，在 `handleSelect` 中添加 `IDBStore.setConfig('currentMode', modeId)`

### 2. ModelPickerDialog.jsx — setModel 未持久化

**文件**: `src/components/modals/ModelPickerDialog.jsx` 行 24
**问题**: `setModel(id)` 直接从 store 取，仅更新内存
**修复**: 引入 `useModels` hook，用其 `setModel` 方法替换直接 store 调用

### 3. MemoryDialog.jsx — 编辑/删除/清除记忆未持久化

**文件**: `src/components/modals/MemoryDialog.jsx` 行 39-40, 48
**问题**: 直接调用 `editMemoryItem`/`deleteMemoryItem`/`clearMemory`（来自 store），不持久化
**修复**: 引入 `src/context/memory.js` 中的 `editMemoryItem`/`deleteMemoryItem`/`clearMemory` 函数（已包含 IDBStore 持久化），替换 store 方法

### 4. AgentsPage.jsx — setCurrentAgentId 未持久化

**文件**: `src/components/agents/AgentsPage.jsx` 行 68
**问题**: `setCurrentAgentId(agentId)` 仅更新内存
**修复**: 引入 `useAgents` hook，用其 `select` 方法替换手动 setCurrentAgentId + loadPrompt 逻辑

### 5. ChatArea.jsx — handleRegenerate 修改消息后未持久化

**文件**: `src/components/chat/ChatArea.jsx` 行 69
**问题**: `useChatStore.setState({chats:...})` 删除了 assistant 消息但未写回 IDB
**修复**: 引入 `IDBStore`，在消息 pop 后添加 `IDBStore.saveChat(chat)`

## Chat 系统性持久化缺失（严重）

以下 chatStore 操作全部缺少 IDBStore 持久化，意味着**所有对话数据刷新即丢失**：

| 操作 | 调用位置 | 缺失 |
|------|----------|------|
| `createChat()` | InputArea.jsx:279, Sidebar.jsx:19 | `IDBStore.saveChat(chat)` + `IDBStore.setConfig('activeChatId', chat.id)` |
| `addMessage()` | InputArea.jsx:287,309,313, ChatArea.jsx:84,87 | `IDBStore.saveChat(chat)` |
| `deleteChat()` | ConfirmDeleteDialog.jsx:11, Sidebar.jsx:91 | `IDBStore.deleteChat(chatId)` + `IDBStore.setConfig('activeChatId', newId)` |
| `renameChat()` | RenameDialog.jsx:23, Sidebar.jsx:92 | `IDBStore.saveChat(chat)` |
| `switchToChat()` | Sidebar.jsx:24 | `IDBStore.setConfig('activeChatId', id)` |

**修复策略**: 创建 `src/hooks/useChats.js` hook，封装所有 chat 操作并包含 IDBStore 持久化，然后让各组件使用该 hook 替代直接调用 chatStore 方法。

## 修复步骤

### Step 1: 修复 ModeSelector.jsx
- 添加 `import { IDBStore } from '@/services/storage'`
- `handleSelect` 中 `setCurrentMode(modeId)` 后添加 `IDBStore.setConfig('currentMode', modeId)`

### Step 2: 修复 ModelPickerDialog.jsx
- 添加 `import useModels from '@/hooks/useModels'`
- 组件内 `const { setModel: setModelPersist } = useModels()`
- `handleSelect` 中 `setModel(id)` → `setModelPersist(id)`
- 移除 `const setModel = useModelStore(s => s.setModel)`

### Step 3: 修复 MemoryDialog.jsx
- 添加 `import { editMemoryItem, deleteMemoryItem, clearMemory } from '@/context/memory'`
- 替换 store 解构：移除 `editMemoryItem`/`deleteMemoryItem`/`clearMemory` 从 `useMemoryStore`
- 行 39: `editMemoryItem(i, val)` → `editMemoryItem(i, val)`（现在用 context 版本）
- 行 40: `deleteMemoryItem(i)` → `deleteMemoryItem(i)`（现在用 context 版本）
- 行 48: `clearMemory` → `clearMemory`（现在用 context 版本）

### Step 4: 修复 AgentsPage.jsx
- 添加 `import useAgents from '@/hooks/useAgents'`
- 组件内 `const { select: selectAgent } = useAgents()`
- `handleSelectAgent` 中替换手动逻辑为 `selectAgent(agentId)`，保留后续的 showToast 和 setCurrentPage

### Step 5: 修复 ChatArea.jsx handleRegenerate
- 添加 `import { IDBStore } from '@/services/storage'`（已有 API import，需添加 IDBStore）
- 行 69 后添加 `await IDBStore.saveChat(chat)`

### Step 6: 创建 useChats.js hook 并替换所有 chat 操作
- 创建 `src/hooks/useChats.js`，封装 createChat/addMessage/deleteChat/renameChat/switchToChat 并包含 IDBStore 持久化
- 修改 `InputArea.jsx`：使用 useChats hook
- 修改 `ChatArea.jsx`：使用 useChats hook 的 addMessage
- 修改 `Sidebar.jsx`：使用 useChats hook
- 修改 `ConfirmDeleteDialog.jsx`：使用 useChats hook 的 deleteChat
- 修改 `RenameDialog.jsx`：使用 useChats hook 的 renameChat

## 验证步骤

1. `npm run build` 构建成功
2. 切换对话模式 → 刷新 → 模式保留
3. 顶栏切换模型 → 刷新 → 模型保留
4. 编辑/删除/清除记忆 → 刷新 → 记忆操作保留
5. 选择智能体 → 刷新 → 智能体选择保留
6. 发送消息 → 刷新 → 消息保留
7. 新建对话 → 刷新 → 对话保留
8. 删除对话 → 刷新 → 对话确实被删除
9. 重命名对话 → 刷新 → 名称保留
10. 切换对话 → 刷新 → 当前对话保留
11. 重新生成 → 刷新 → 旧消息不重复出现
