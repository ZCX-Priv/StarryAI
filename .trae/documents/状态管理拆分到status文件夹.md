# 状态管理拆分计划：将 Zustand Store 拆分到 `status/` 文件夹

## 概述

将当前单一 `useAppStore`（30+ 状态字段、30+ action）按功能域拆分为 7 个独立 Zustand store，并将所有 hooks 一并移入 `src/status/` 文件夹，统一管理状态相关逻辑。

## 当前状态分析

### 现有文件结构
```
src/store/useAppStore.js    ← 单一巨型 store（160行）
src/hooks/useStore.js       ← 初始化 hook
src/hooks/useTheme.js       ← 主题 hook
src/hooks/useAgents.js      ← 智能体 hook
src/hooks/useBanner.js      ← Banner hook
src/hooks/useKeys.js        ← Key hook
src/hooks/useModels.js      ← 模型 hook
src/hooks/useScroll.js      ← 滚动 hook
```

### 引用 useAppStore 的文件（30个）
- 组件层：`ChatArea`, `EmptyState`, `AgentsPage`, `ModelPickerDialog`, `Sidebar`, `Topbar`, `SettingsDialog`, `HoneycombCanvas`, `MessageList`, `InputArea`, `ModeSelector`, `AppShell`, `MemoryDialog`, `MessageActions`, `StreamStatus`, `ConfirmDeleteDialog`, `RenameDialog`, `CreateCategoryDialog`, `CreateAgentDialog`
- 服务层：`context/memory.js`, `context/systemPrompt.js`, `lib/prompts.js`, `services/api.js`
- Hooks 层：7 个 hooks 文件

## 拆分方案

### 目标目录结构
```
src/status/
├── index.js              ← 统一导出所有 store 和 hooks
├── chatStore.js          ← 聊天相关状态
├── keyStore.js           ← API Key 管理
├── uiStore.js            ← UI 状态
├── modelStore.js         ← 模型与模式配置
├── memoryStore.js        ← 记忆与提示词模板
├── agentStore.js         ← 智能体管理
├── bannerStore.js        ← Banner 模式
├── useStore.js           ← 应用初始化 hook
├── useTheme.js           ← 主题 hook
├── useAgents.js          ← 智能体 hook
├── useBanner.js          ← Banner hook
├── useKeys.js            ← Key 管理 hook
├── useModels.js          ← 模型管理 hook
├── useScroll.js          ← 滚动控制 hook
```

### 各 Store 状态分配

#### 1. `chatStore.js` — 聊天相关
| 状态 | 类型 | Actions |
|------|------|---------|
| `chats` | `Chat[]` | `setChats` |
| `activeChatId` | `string\|null` | `setActiveChatId` |
| `isStreaming` | `boolean` | `setIsStreaming` |
| `stopRequested` | `boolean` | `setStopRequested` |
| `streamingText` | `string` | `setStreamingText` |
| `autoScroll` | `boolean` | `setAutoScroll` |
| | | `createChat` (跨 store 读取 modelStore.model, agentStore.currentAgentId) |
| | | `switchToChat` |
| | | `deleteChat` |
| | | `addMessage` |
| | | `renameChat` |

#### 2. `keyStore.js` — API Key 管理
| 状态 | 类型 | Actions |
|------|------|---------|
| `keys` | `string[]` | `setKeys` |
| `activeKey` | `string\|null` | `setActiveKey` |
| | | `addKey` |
| | | `deleteKey` |
| | | `activateKey` |

#### 3. `uiStore.js` — UI 状态
| 状态 | 类型 | Actions |
|------|------|---------|
| `theme` | `string` | `setTheme` |
| `honeycomb` | `boolean` | `setHoneycomb` |
| `honeycombNeedsRedraw` | `boolean` | `triggerHoneycombRedraw`, `clearHoneycombRedraw` |
| `settingsTab` | `string` | `setSettingsTab` |
| `currentPage` | `string` | `setCurrentPage` |
| `toastMessage` | `string\|null` | `showToast` |
| `toastVisible` | `boolean` | |
| `lang` | `string` | |

#### 4. `modelStore.js` — 模型与模式配置
| 状态 | 类型 | Actions |
|------|------|---------|
| `model` | `string` | `setModel` |
| `models` | `Model[]` | `setModels` |
| `currentMode` | `string` | `setCurrentMode` |
| `modePrompt` | `string\|null` | `setModePrompt` |
| `modeConfig` | `object` | |
| `temperature` | `number` | `setTemperature` |
| `topP` | `number` | `setTopP` |
| `contextLength` | `number` | `setContextLength` |

#### 5. `memoryStore.js` — 记忆与提示词模板
| 状态 | 类型 | Actions |
|------|------|---------|
| `memory` | `string[]` | `setMemory` |
| `mainPromptTemplate` | `string\|null` | `setMainPromptTemplate` |
| `memoryExtractTemplate` | `string\|null` | `setMemoryExtractTemplate` |
| `memoryDeduplicateTemplate` | `string\|null` | `setMemoryDeduplicateTemplate` |
| | | `addMemoryItems` |
| | | `setMemoryItems` |
| | | `editMemoryItem` |
| | | `deleteMemoryItem` |
| | | `clearMemory` |

#### 6. `agentStore.js` — 智能体管理
| 状态 | 类型 | Actions |
|------|------|---------|
| `agentsConfig` | `object\|null` | `setAgentsConfig` |
| `currentAgentId` | `string\|null` | `setCurrentAgentId` |
| `agentPrompt` | `string\|null` | `setAgentPrompt` |

#### 7. `bannerStore.js` — Banner 模式
| 状态 | 类型 | Actions |
|------|------|---------|
| `bannerConfig` | `object\|null` | `setBannerConfig` |
| `currentBannerMode` | `string\|null` | `setCurrentBannerMode` |
| `bannerPrompt` | `string\|null` | `setBannerPrompt` |

### 跨 Store 依赖处理

`createChat` action 需要读取 `modelStore.model` 和 `agentStore.currentAgentId`，使用 Zustand 的 `otherStore.getState()` 模式：

```js
// chatStore.js
import { useModelStore } from './modelStore';
import { useAgentStore } from './agentStore';

createChat: () => {
  const model = useModelStore.getState().model;
  const currentAgentId = useAgentStore.getState().currentAgentId;
  // ...
}
```

### `index.js` 统一导出

```js
export { useChatStore } from './chatStore';
export { useKeyStore } from './keyStore';
export { useUiStore } from './uiStore';
export { useModelStore } from './modelStore';
export { useMemoryStore } from './memoryStore';
export { useAgentStore } from './agentStore';
export { useBannerStore } from './bannerStore';

export { default as useStore } from './useStore';
export { default as useTheme } from './useTheme';
export { default as useAgents } from './useAgents';
export { default as useBanner } from './useBanner';
export { default as useKeys } from './useKeys';
export { default as useModels } from './useModels';
export { useScroll } from './useScroll';
```

## 实施步骤

### 步骤 1：创建 `src/status/` 目录和 7 个 store 文件
- 创建 `chatStore.js`, `keyStore.js`, `uiStore.js`, `modelStore.js`, `memoryStore.js`, `agentStore.js`, `bannerStore.js`
- 每个文件使用 `create` 创建独立 Zustand store
- 处理跨 store 依赖（`createChat` 读取 modelStore 和 agentStore）

### 步骤 2：创建 `src/status/index.js` 统一导出

### 步骤 3：迁移 7 个 hooks 到 `src/status/`
- 将 `src/hooks/` 下所有文件移到 `src/status/`
- 更新 hooks 内部 import：`@/store/useAppStore` → 各自对应的 store
- 更新 hooks 内部跨 store 引用

### 步骤 4：更新所有组件和服务的 import
- 30 个引用 `@/store/useAppStore` 的文件需要更新
- 将 `useAppStore(s => s.xxx)` 替换为对应的 `useXxxStore(s => s.xxx)`
- 将 `useAppStore.getState().xxx` 替换为对应的 `useXxxStore.getState().xxx`

### 步骤 5：删除旧文件
- 删除 `src/store/useAppStore.js`
- 删除 `src/store/` 目录（如果为空）
- 删除 `src/hooks/` 目录（如果为空）

### 步骤 6：验证
- `npm run build` 确保无编译错误
- `npm run dev` 确保页面正常运行

## 需要更新 import 的文件清单

### 组件文件（18个）
| 文件 | 使用的 store |
|------|-------------|
| `ChatArea.jsx` | chatStore, uiStore |
| `EmptyState.jsx` | chatStore |
| `MessageList.jsx` | chatStore |
| `InputArea.jsx` | chatStore, modelStore, bannerStore |
| `ModeSelector.jsx` | modelStore |
| `MessageActions.jsx` | chatStore |
| `StreamStatus.jsx` | chatStore |
| `AgentsPage.jsx` | agentStore |
| `CreateAgentDialog.jsx` | agentStore |
| `CreateCategoryDialog.jsx` | agentStore |
| `Sidebar.jsx` | chatStore, uiStore |
| `Topbar.jsx` | uiStore, chatStore |
| `AppShell.jsx` | uiStore |
| `HoneycombCanvas.jsx` | uiStore |
| `SettingsDialog.jsx` | uiStore, keyStore, modelStore |
| `ModelPickerDialog.jsx` | modelStore |
| `MemoryDialog.jsx` | memoryStore |
| `ConfirmDeleteDialog.jsx` | chatStore |
| `RenameDialog.jsx` | chatStore |

### 服务/工具文件（4个）
| 文件 | 使用的 store |
|------|-------------|
| `context/memory.js` | memoryStore, keyStore, uiStore(showToast) |
| `context/systemPrompt.js` | memoryStore, modelStore |
| `lib/prompts.js` | memoryStore, modelStore, agentStore, bannerStore |
| `services/api.js` | keyStore, chatStore, modelStore |

### Hooks 文件（7个）— 迁移到 status/ 并更新内部 import

## 假设与决策

1. **Store 命名**：使用 `useXxxStore` 命名（Zustand 惯例），如 `useChatStore`
2. **跨 store 通信**：使用 `otherStore.getState()` 模式，不引入中间件
3. **context/ 目录**：保持原位置不变，仅更新其内部 import 路径
4. **hooks 命名**：保持原有命名不变
5. **index.js 导出**：提供统一入口，组件可选择从 `@/status` 或 `@/status/xxxStore` 导入
