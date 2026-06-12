# 状态管理拆分计划：从单一 Store 到多领域 Store

## 概述

将 `src/store/useAppStore.js`（单一 Zustand Store，30+ 状态字段、30+ action）按业务领域拆分为 9 个独立 Store，放入 `src/status/` 目录。

## 当前状态分析

- **单一 Store**：`src/store/useAppStore.js` 集中管理所有状态
- **30 个文件** 直接导入 `useAppStore`
- **跨域依赖**：`api.js` 读取 6 个域的状态，`systemPrompt.js`/`prompts.js` 读取 4 个域
- **Hooks 中间层**：6 个 Hook 封装了 Store 访问和 IndexedDB 同步

## 拆分方案

### 目录结构

```
src/status/
├── index.js          # 统一导出所有 store
├── chatStore.js      # 对话管理
├── keyStore.js       # API 密钥
├── modelStore.js     # 模型与参数
├── memoryStore.js    # 记忆系统
├── themeStore.js     # 主题外观
├── streamStore.js    # 流式输出与滚动
├── modeStore.js      # 模式与提示词
├── agentStore.js     # 智能体
└── uiStore.js        # UI 状态
```

### 各 Store 详细划分

#### 1. chatStore.js — 对话管理
| 字段 | 类型 | 说明 |
|------|------|------|
| `chats` | Array | 所有对话列表 |
| `activeChatId` | String\|null | 当前激活对话 ID |
| `setChats` | Action | 设置对话列表 |
| `setActiveChatId` | Action | 设置激活对话 |
| `createChat` | Action | 创建新对话（跨域读取 modelStore.model、agentStore.currentAgentId；跨域调用 uiStore.setCurrentPage） |
| `switchToChat` | Action | 切换对话（跨域调用 uiStore.setCurrentPage） |
| `deleteChat` | Action | 删除对话 |
| `addMessage` | Action | 添加消息 |
| `renameChat` | Action | 重命名对话 |

#### 2. keyStore.js — API 密钥
| 字段 | 类型 | 说明 |
|------|------|------|
| `keys` | Array | 密钥列表 |
| `activeKey` | String\|null | 当前激活密钥 |
| `setKeys` | Action | 设置密钥列表 |
| `setActiveKey` | Action | 设置激活密钥 |
| `addKey` | Action | 添加密钥 |
| `deleteKey` | Action | 删除密钥 |
| `activateKey` | Action | 激活密钥 |

#### 3. modelStore.js — 模型与参数
| 字段 | 类型 | 说明 |
|------|------|------|
| `model` | String | 当前模型 ID |
| `models` | Array | 可用模型列表 |
| `temperature` | Number | 温度参数 |
| `topP` | Number | Top-P 参数 |
| `contextLength` | Number | 上下文长度 |
| `setModel` | Action | 设置模型 |
| `setModels` | Action | 设置模型列表 |
| `setTemperature` | Action | 设置温度 |
| `setTopP` | Action | 设置 Top-P |
| `setContextLength` | Action | 设置上下文长度 |

#### 4. memoryStore.js — 记忆系统
| 字段 | 类型 | 说明 |
|------|------|------|
| `memory` | Array | 记忆条目 |
| `setMemory` | Action | 设置记忆 |
| `addMemoryItems` | Action | 添加记忆条目 |
| `setMemoryItems` | Action | 替换记忆列表 |
| `editMemoryItem` | Action | 编辑记忆条目 |
| `deleteMemoryItem` | Action | 删除记忆条目 |
| `clearMemory` | Action | 清除所有记忆 |

#### 5. themeStore.js — 主题外观
| 字段 | 类型 | 说明 |
|------|------|------|
| `theme` | String | 主题模式 |
| `honeycomb` | Boolean | 蜂巢动画开关 |
| `honeycombNeedsRedraw` | Boolean | 蜂巢重绘标记 |
| `setTheme` | Action | 设置主题 |
| `setHoneycomb` | Action | 设置蜂巢开关 |
| `triggerHoneycombRedraw` | Action | 触发重绘 |
| `clearHoneycombRedraw` | Action | 清除重绘标记 |

#### 6. streamStore.js — 流式输出与滚动
| 字段 | 类型 | 说明 |
|------|------|------|
| `isStreaming` | Boolean | 是否正在流式输出 |
| `stopRequested` | Boolean | 是否请求停止 |
| `streamingText` | String | 流式文本 |
| `autoScroll` | Boolean | 自动滚动 |
| `setIsStreaming` | Action | 设置流式状态 |
| `setStopRequested` | Action | 设置停止请求 |
| `setStreamingText` | Action | 设置流式文本 |
| `setAutoScroll` | Action | 设置自动滚动 |

#### 7. modeStore.js — 模式与提示词
| 字段 | 类型 | 说明 |
|------|------|------|
| `currentMode` | String | 当前模式 (fast/thinking/expert) |
| `modePrompt` | String\|null | 模式提示词 |
| `modeConfig` | Object | 模式配置 |
| `currentBannerMode` | String\|null | 当前 Banner 模式 |
| `bannerPrompt` | String\|null | Banner 提示词 |
| `bannerConfig` | Object\|null | Banner 配置 |
| `mainPromptTemplate` | String\|null | 主提示词模板 |
| `memoryExtractTemplate` | String\|null | 记忆提取模板 |
| `memoryDeduplicateTemplate` | String\|null | 记忆去重模板 |
| `setCurrentMode` | Action | 设置模式 |
| `setModePrompt` | Action | 设置模式提示词 |
| `setCurrentBannerMode` | Action | 设置 Banner 模式 |
| `setBannerPrompt` | Action | 设置 Banner 提示词 |
| `setBannerConfig` | Action | 设置 Banner 配置 |
| `setMainPromptTemplate` | Action | 设置主模板 |
| `setMemoryExtractTemplate` | Action | 设置记忆提取模板 |
| `setMemoryDeduplicateTemplate` | Action | 设置记忆去重模板 |

#### 8. agentStore.js — 智能体
| 字段 | 类型 | 说明 |
|------|------|------|
| `currentAgentId` | String\|null | 当前智能体 ID |
| `agentPrompt` | String\|null | 智能体提示词 |
| `agentsConfig` | Object\|null | 智能体配置 |
| `setCurrentAgentId` | Action | 设置当前智能体 |
| `setAgentPrompt` | Action | 设置智能体提示词 |
| `setAgentsConfig` | Action | 设置智能体配置 |

#### 9. uiStore.js — UI 状态
| 字段 | 类型 | 说明 |
|------|------|------|
| `currentPage` | String | 当前页面 |
| `settingsTab` | String | 设置面板标签页 |
| `toastMessage` | String\|null | Toast 消息 |
| `toastVisible` | Boolean | Toast 可见性 |
| `lang` | String | 语言 |
| `setCurrentPage` | Action | 设置页面 |
| `setSettingsTab` | Action | 设置标签页 |
| `showToast` | Action | 显示 Toast |
| `setLang` | Action | 设置语言（新增，原无 setter） |

### index.js 统一导出

```js
export { default as useChatStore } from './chatStore';
export { default as useKeyStore } from './keyStore';
export { default as useModelStore } from './modelStore';
export { default as useMemoryStore } from './memoryStore';
export { default as useThemeStore } from './themeStore';
export { default as useStreamStore } from './streamStore';
export { default as useModeStore } from './modeStore';
export { default as useAgentStore } from './agentStore';
export { default as useUiStore } from './uiStore';
```

## 跨域依赖处理策略

Zustand 多 Store 架构中，跨域访问通过 `otherStore.getState()` 实现（命令式），不产生循环依赖：

| 源 | 需要访问的域 | 访问方式 |
|----|------------|---------|
| `chatStore.createChat` | modelStore.model, agentStore.currentAgentId, uiStore.setCurrentPage | `getState()` |
| `chatStore.switchToChat` | uiStore.setCurrentPage | `getState()` |
| `api.js` | modelStore, modeStore, keyStore, streamStore | `getState()` |
| `systemPrompt.js` | modeStore, memoryStore, agentStore | `getState()` |
| `prompts.js` | modeStore, memoryStore, agentStore | `getState()` |
| `memory.js` | keyStore, memoryStore, modeStore, uiStore | `getState()` |
| `useStore.js` (初始化) | 所有 Store | `getState()` |
| `useTheme.js` | themeStore | 直接订阅 |
| `useModels.js` | modelStore, chatStore | `getState()` |

## 实施步骤

### 步骤 1：创建 `src/status/` 目录和 9 个 Store 文件
- 每个文件使用 `create` from `zustand` 创建独立 Store
- 跨域依赖通过 `import otherStore` + `otherStore.getState()` 处理
- 注意循环依赖：chatStore 导入 uiStore，uiStore 不导入 chatStore

### 步骤 2：创建 `src/status/index.js` 统一导出

### 步骤 3：更新所有消费文件的导入路径
需要更新的 30 个文件，按类型分组：

**Hooks（7 个文件）：**
- `src/hooks/useStore.js` — 导入所有 Store
- `src/hooks/useAgents.js` → 导入 agentStore
- `src/hooks/useBanner.js` → 导入 modeStore
- `src/hooks/useKeys.js` → 导入 keyStore
- `src/hooks/useModels.js` → 导入 modelStore + chatStore
- `src/hooks/useScroll.js` → 导入 streamStore
- `src/hooks/useTheme.js` → 导入 themeStore

**Context（2 个文件）：**
- `src/context/memory.js` → 导入 keyStore + memoryStore + modeStore + uiStore
- `src/context/systemPrompt.js` → 导入 modeStore + memoryStore + agentStore

**Services（1 个文件）：**
- `src/services/api.js` → 导入 modelStore + modeStore + keyStore + streamStore

**Lib（1 个文件）：**
- `src/lib/prompts.js` → 导入 modeStore + memoryStore + agentStore

**Components（19 个文件）：**
- `src/components/layout/AppShell.jsx` → uiStore + streamStore
- `src/components/layout/Topbar.jsx` → chatStore + modelStore + memoryStore
- `src/components/layout/Sidebar.jsx` → chatStore + uiStore
- `src/components/layout/HoneycombCanvas.jsx` → themeStore
- `src/components/chat/ChatArea.jsx` → chatStore + streamStore + modelStore + modeStore
- `src/components/chat/InputArea.jsx` → streamStore + chatStore + modelStore + modeStore + keyStore + uiStore
- `src/components/chat/ModeSelector.jsx` → modeStore
- `src/components/chat/StreamStatus.jsx` → streamStore
- `src/components/chat/MessageList.jsx` → chatStore + streamStore
- `src/components/chat/MessageActions.jsx` → chatStore
- `src/components/chat/EmptyState.jsx` → uiStore + modeStore
- `src/components/modals/SettingsDialog.jsx` → themeStore + modelStore + keyStore + uiStore
- `src/components/modals/ModelPickerDialog.jsx` → modelStore
- `src/components/modals/MemoryDialog.jsx` → memoryStore
- `src/components/modals/RenameDialog.jsx` → chatStore
- `src/components/agents/AgentsPage.jsx` → agentStore + uiStore
- `src/components/agents/CreateAgentDialog.jsx` → agentStore + uiStore
- `src/components/agents/CreateCategoryDialog.jsx` → agentStore + uiStore
- `src/components/modals/ConfirmDeleteDialog.jsx` → chatStore

### 步骤 4：删除旧文件
- 删除 `src/store/useAppStore.js`
- 删除 `src/store/` 目录（如为空）

### 步骤 5：验证
- `npm run build` 无报错
- `npm run dev` 页面功能正常
- 无控制台错误

## 假设与决策

1. **不改变 Hooks 接口**：各 Hook 返回值保持不变，仅内部从多 Store 读取
2. **不改变组件接口**：组件的 props 和行为不变
3. **跨域操作用 `getState()`**：避免循环依赖，保持单向数据流
4. **modeStore 合并了 Banner 和提示词模板**：因为它们都与"对话上下文/模式"相关
5. **modelStore 包含模型参数**：temperature/topP/contextLength 是模型级参数
6. **uiStore 包含 Toast**：Toast 是全局 UI 状态
