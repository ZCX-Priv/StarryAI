# 状态管理拆分计划：将 Zustand Store 拆分到 `status` 文件夹

## 概述

将当前单一的 `src/store/useAppStore.js`（约 160 行，40+ 状态字段，30+ actions）按业务领域拆分为多个独立的 Zustand store slice，统一放置在 `src/status/` 文件夹中。

## 当前状态分析

当前所有状态集中在一个文件 `src/store/useAppStore.js`，包含以下领域：

| 领域 | 状态字段 | Actions |
|------|---------|---------|
| 聊天 | `chats`, `activeChatId`, `isStreaming`, `stopRequested`, `streamingText`, `autoScroll` | `createChat`, `switchToChat`, `deleteChat`, `addMessage`, `renameChat`, `setChats`, `setActiveChatId`, `setIsStreaming`, `setStopRequested`, `setStreamingText`, `setAutoScroll` |
| 密钥 | `keys`, `activeKey` | `setKeys`, `setActiveKey`, `addKey`, `deleteKey`, `activateKey` |
| 记忆 | `memory` | `setMemory`, `addMemoryItems`, `setMemoryItems`, `editMemoryItem`, `deleteMemoryItem`, `clearMemory` |
| 模型/模式 | `model`, `models`, `currentMode`, `modeConfig`, `modePrompt`, `temperature`, `topP`, `contextLength` | `setModel`, `setModels`, `setCurrentMode`, `setModePrompt`, `setTemperature`, `setTopP`, `setContextLength` |
| 智能体 | `currentAgentId`, `agentPrompt`, `agentsConfig` | `setCurrentAgentId`, `setAgentPrompt`, `setAgentsConfig` |
| 横幅 | `currentBannerMode`, `bannerPrompt`, `bannerConfig` | `setCurrentBannerMode`, `setBannerPrompt`, `setBannerConfig` |
| UI | `theme`, `honeycomb`, `honeycombNeedsRedraw`, `settingsTab`, `currentPage`, `toastMessage`, `toastVisible`, `lang` | `setTheme`, `setHoneycomb`, `triggerHoneycombRedraw`, `clearHoneycombRedraw`, `setSettingsTab`, `setCurrentPage`, `showToast` |
| 提示词模板 | `mainPromptTemplate`, `memoryExtractTemplate`, `memoryDeduplicateTemplate` | `setMainPromptTemplate`, `setMemoryExtractTemplate`, `setMemoryDeduplicateTemplate` |

**影响范围**：30 个文件引用了 `@/store/useAppStore`

## 拆分方案

### 新目录结构

```
src/status/
├── useChatStore.js        # 聊天相关状态
├── useKeyStore.js         # 密钥管理
├── useMemoryStore.js      # 记忆管理
├── useModelStore.js       # 模型/模式配置
├── useAgentStore.js       # 智能体配置
├── useBannerStore.js      # 横幅/快捷功能
├── useUIStore.js          # UI 状态（主题、页面、Toast等）
├── usePromptStore.js      # 提示词模板
└── index.js               # 统一导出所有 store
```

### 各 Store 详细内容

#### 1. `useChatStore.js`
```js
状态: chats, activeChatId, isStreaming, stopRequested, streamingText, autoScroll
Actions: setChats, setActiveChatId, setIsStreaming, setStopRequested, setStreamingText,
         setAutoScroll, createChat, switchToChat, deleteChat, addMessage, renameChat
```

#### 2. `useKeyStore.js`
```js
状态: keys, activeKey
Actions: setKeys, setActiveKey, addKey, deleteKey, activateKey
```

#### 3. `useMemoryStore.js`
```js
状态: memory
Actions: setMemory, addMemoryItems, setMemoryItems, editMemoryItem, deleteMemoryItem, clearMemory
```

#### 4. `useModelStore.js`
```js
状态: model, models, currentMode, modeConfig, modePrompt, temperature, topP, contextLength
Actions: setModel, setModels, setCurrentMode, setModePrompt, setTemperature, setTopP, setContextLength
```

#### 5. `useAgentStore.js`
```js
状态: currentAgentId, agentPrompt, agentsConfig
Actions: setCurrentAgentId, setAgentPrompt, setAgentsConfig
```

#### 6. `useBannerStore.js`
```js
状态: currentBannerMode, bannerPrompt, bannerConfig
Actions: setCurrentBannerMode, setBannerPrompt, setBannerConfig
```

#### 7. `useUIStore.js`
```js
状态: theme, honeycomb, honeycombNeedsRedraw, settingsTab, currentPage, toastMessage, toastVisible, lang
Actions: setTheme, setHoneycomb, triggerHoneycombRedraw, clearHoneycombRedraw,
         setSettingsTab, setCurrentPage, showToast
```

#### 8. `usePromptStore.js`
```js
状态: mainPromptTemplate, memoryExtractTemplate, memoryDeduplicateTemplate
Actions: setMainPromptTemplate, setMemoryExtractTemplate, setMemoryDeduplicateTemplate
```

#### 9. `index.js` - 统一导出
```js
export { default as useChatStore } from './useChatStore';
export { default as useKeyStore } from './useKeyStore';
// ... 其他 store
```

### 跨 Store 引用处理

部分 action 需要访问其他 store 的状态，处理方式：

1. **`createChat`**（useChatStore）需要读取 `model` 和 `currentAgentId`：
   - 通过 `useModelStore.getState().model` 和 `useAgentStore.getState().currentAgentId` 跨 store 读取

2. **`showToast`**（useUIStore）无跨 store 依赖，保持不变

3. **`deleteChat`**（useChatStore）无跨 store 依赖，保持不变

### 迁移策略

1. 创建 `src/status/` 文件夹和 8 个 store 文件 + index.js
2. 在 `src/store/useAppStore.js` 中重新导出所有子 store 的组合，保持向后兼容（过渡期）
3. 逐文件更新 30 个引用文件的 import 路径
4. 删除旧的 `src/store/useAppStore.js` 和 `src/store/` 文件夹

### 引用文件更新映射

每个文件需要根据其使用的状态字段，将 `import useAppStore from '@/store/useAppStore'` 替换为对应的子 store import：

| 文件 | 需要的 Store |
|------|-------------|
| `components/chat/ChatArea.jsx` | useChatStore, useModelStore |
| `components/chat/InputArea.jsx` | useChatStore, useModelStore, useKeyStore, useBannerStore, useUIStore |
| `components/chat/StreamStatus.jsx` | useChatStore |
| `components/chat/MessageActions.jsx` | useChatStore, useUIStore |
| `components/chat/EmptyState.jsx` | useChatStore, useBannerStore, useUIStore |
| `components/chat/ModeSelector.jsx` | useModelStore |
| `components/chat/MessageList.jsx` | useChatStore |
| `components/layout/Topbar.jsx` | useChatStore, useModelStore, useMemoryStore |
| `components/layout/AppShell.jsx` | useUIStore, useChatStore |
| `components/layout/Sidebar.jsx` | useChatStore, useUIStore |
| `components/layout/HoneycombCanvas.jsx` | useUIStore |
| `components/modals/SettingsDialog.jsx` | useKeyStore, useUIStore, useModelStore |
| `components/modals/MemoryDialog.jsx` | useMemoryStore |
| `components/modals/ModelPickerDialog.jsx` | useModelStore |
| `components/modals/RenameDialog.jsx` | useChatStore |
| `components/modals/ConfirmDeleteDialog.jsx` | useChatStore |
| `components/agents/AgentsPage.jsx` | useAgentStore, useUIStore |
| `components/agents/CreateAgentDialog.jsx` | useAgentStore, useUIStore |
| `components/agents/CreateCategoryDialog.jsx` | useAgentStore, useUIStore |
| `hooks/useStore.js` | 所有 store（初始化） |
| `hooks/useAgents.js` | useAgentStore |
| `hooks/useBanner.js` | useBannerStore |
| `hooks/useKeys.js` | useKeyStore |
| `hooks/useModels.js` | useModelStore |
| `hooks/useScroll.js` | useChatStore |
| `hooks/useTheme.js` | useUIStore |
| `services/api.js` | useKeyStore, useChatStore, useModelStore |
| `context/memory.js` | useMemoryStore, useUIStore |
| `context/systemPrompt.js` | usePromptStore, useModelStore, useAgentStore, useMemoryStore, useBannerStore |
| `lib/prompts.js` | usePromptStore, useModelStore |

## 假设与决策

1. **使用 Zustand 独立 store 而非 slice 模式**：每个领域创建独立的 `create()` store，而非使用 Zustand 的 slice pattern 合并到一个 store。这样更简洁，各 store 完全独立。
2. **跨 store 读取通过 `getXxxStore.getState()`**：Zustand 的独立 store 之间可以直接通过 `getState()` 互相读取，无需合并。
3. **`lang` 字段**：当前未被任何 action 修改（没有 setLang），放入 useUIStore。
4. **向后兼容**：不保留旧的 `useAppStore`，直接全部替换，一步到位。

## 验证步骤

1. `npm run build` 无报错
2. `npm run dev` 启动正常
3. 页面功能正常：侧边栏、聊天、智能体广场、设置、模式切换
4. 无控制台错误
