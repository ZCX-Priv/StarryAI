# React+JS 迁移到 React+TS 计划

## 概述

将当前 React+JS 项目（59个源文件）迁移为 React+TS 项目，包括：安装 TypeScript 依赖、创建配置文件、为所有模块添加类型定义、将文件扩展名从 .js/.jsx 改为 .ts/.tsx。

## 当前状态分析

- **59个源文件**需转换：30个 JSX + 29个 JS
- **无 tsconfig.json**，需从零创建
- **已有** `@types/react` 和 `@types/react-dom` 作为 devDependencies
- **Zustand 9个 Store** 全部无类型（使用 `create((set, get) => ({...}))` 模式）
- **Vite `?raw` 导入** `.md` 文件需类型声明
- **路径别名 `@`** 需在 tsconfig 中同步配置
- **components.json** 中 `"tsx": false` 需改为 `true`
- **eslint.config.js** 仅覆盖 `**/*.{js,jsx}`，需扩展

## 迁移策略

采用**渐进式迁移**：先搭建 TS 基础设施（配置+类型声明），再按依赖顺序从底层到上层逐文件转换。每步确保 `npm run build` 通过。

## 实施步骤

### 第1步：安装 TypeScript 依赖

```bash
npm install -D typescript @types/node
```

- `typescript`：编译器
- `@types/node`：Node.js 类型（vite.config.ts 中使用 `path`、`__dirname`）

### 第2步：创建 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": false,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src", "vite-env.d.ts"]
}
```

策略：先设 `strict: true` 但 `noUnusedLocals/Parameters: false`，避免大量未使用变量报错阻塞迁移。后续可逐步收紧。

### 第3步：创建类型声明文件

**src/vite-env.d.ts**：
```typescript
/// <reference types="vite/client" />

declare module '*.md?raw' {
  const content: string;
  export default content;
}
```

### 第4步：将 vite.config.js 重命名为 vite.config.ts

内容基本不变，但 `path` 和 `__dirname` 在 TS + ESM 中需要处理。Vite 内部会处理 `__dirname`，但需确保 `@types/node` 已安装。

### 第5步：定义核心类型（src/types/）

创建 `src/types/index.ts`，集中定义项目共享类型：

```typescript
// 聊天相关
export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  rendered?: string;
  ts: number;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  model: string;
  agentId: string | null;
}

// 模型相关
export interface ModelInfo {
  id: string;
  label: string;
  pollen?: number | null;
  paidOnly?: boolean;
  reasoning?: boolean;
  contextLength?: number | null;
}

// 智能体相关
export interface AgentItem {
  id: string;
  name: string;
  avatar: string;
  description: string;
  category: string;
  promptFile: string;
}

export interface AgentCategory {
  id: string;
  name: string;
  icon: string;
}

export interface AgentsConfig {
  categories: AgentCategory[];
  agents: AgentItem[];
}

// Banner 相关
export interface BannerAction {
  id: string;
  label: string;
  icon: string;
  promptFile: string;
  mode?: string;
}

// 模式相关
export type ModeType = 'fast' | 'thinking' | 'expert';

export interface ModeConfig {
  reasoning_effort?: string;
  thinking?: { type: string };
  temperature?: number;
  model?: string;
  useTools?: boolean;
}

// UI 相关
export type PageType = 'chat' | 'agents' | 'settings';
export type SettingsTab = 'appearance' | 'model' | 'keys' | 'memory' | 'about';
```

### 第6步：转换 Zustand Store（9个文件）

为每个 Store 定义 State + Actions 接口。转换顺序按依赖关系：

| 文件 | 依赖 | 关键类型 |
|------|------|---------|
| `streamStore` | 无 | `isStreaming`, `stopRequested`, `streamingText`, `autoScroll` |
| `themeStore` | 无 | `theme`, `honeycomb`, `honeycombNeedsRedraw` |
| `keyStore` | 无 | `keys: string[]`, `activeKey: string\|null` |
| `memoryStore` | 无 | `memory: string[]` |
| `modelStore` | config | `model`, `models: ModelInfo[]`, `temperature`, `topP`, `contextLength` |
| `modeStore` | 无 | `currentMode: ModeType`, `modeConfig`, `bannerPrompt`, 模板字段 |
| `agentStore` | 无 | `currentAgentId`, `agentPrompt`, `agentsConfig` |
| `uiStore` | sonner | `currentPage: PageType`, `settingsTab`, `showToast` |
| `chatStore` | modelStore, agentStore, uiStore | `chats: Chat[]`, `activeChatId`, CRUD actions |

Zustand 泛型模式：
```typescript
interface XxxState { /* 状态字段 */ }
interface XxxActions { /* 方法 */ }
type XxxStore = XxxState & XxxActions;
const useXxxStore = create<XxxStore>((set, get) => ({ ... }));
```

### 第7步：转换 status/index.js → status/index.ts

桶文件，更新导出即可。

### 第8步：转换 lib/（2个文件）

- `lib/config.ts`：为 `KEYS_MAP` 添加 `Record<string, string>` 类型，`DEFAULT_MODELS` 使用 `ModelInfo[]`，`formatContextLength` 添加参数和返回类型
- `lib/prompts.ts`：为所有函数添加参数和返回类型，`modePrompts` 使用 `Record<ModeType, string>`

### 第9步：转换 context/（4个文件）

- `context/time.ts`：纯计算，添加参数/返回类型
- `context/systemPrompt.ts`：添加函数签名类型
- `context/memory.ts`：添加函数签名类型
- `context/index.ts`：更新导出

### 第10步：转换 services/（3个文件）

- `services/storage.ts`：为 `IDBStore` 添加类型，`STORES` 使用 `const`
- `services/api.ts`：最复杂，约170行。为 `_normalizeReasoningValue`、`_extractReasoning`、`_mergeReasoningAndContent`、`_buildParams`、`fetchAPI`、`streamAPI`、`validateKey`、`loadModels` 添加类型。`streamAPI` 是 async generator，返回类型为 `AsyncGenerator<string, void, unknown>`
- `services/migration.ts`：添加函数签名类型

### 第11步：转换 render/（3个文件）

- `render/extractThinking.ts`：纯函数，添加类型
- `render/MarkdownRenderer.jsx → .tsx`：React 组件，添加 Props 类型
- `render/ThinkingBlock.jsx → .tsx`：React 组件，添加 Props 类型
- `render/index.ts`：更新导出

### 第12步：转换 hooks/（8个文件）

每个 hook 添加参数和返回类型。关键文件：
- `hooks/useStore.ts`：初始化 hook
- `hooks/useChats.ts`：返回类型需定义接口
- `hooks/useAgents.ts`：加载/选择/创建智能体
- `hooks/useBanner.ts`：Banner 模式管理
- `hooks/useKeys.ts`：密钥管理
- `hooks/useModels.ts`：模型管理
- `hooks/useScroll.ts`：自动滚动
- `hooks/useTheme.ts`：主题管理

### 第13步：转换 components/（20个 JSX 文件）

所有 `.jsx` → `.tsx`，为组件 Props 添加 interface。按子组件→父组件顺序：

**UI 基础组件**：
- `components/ui/EmptyState.tsx`

**Chat 组件**（先子后父）：
- `ModeSelector.tsx` → `StreamStatus.tsx` → `MessageActions.tsx` → `MessageBubble.tsx` → `MessageList.tsx` → `InputArea.tsx` → `EmptyState.tsx` → `ChatArea.tsx`

**Agent 组件**：
- `AgentCard.tsx` → `AgentSearch.tsx` → `CategoryTabs.tsx` → `CreateAgentDialog.tsx` → `CreateCategoryDialog.tsx` → `AgentsPage.tsx`

**Layout 组件**：
- `HoneycombCanvas.tsx` → `Sidebar.tsx` → `Topbar.tsx` → `AppShell.tsx`

**Modal 组件**：
- `ConfirmDeleteDialog.tsx` → `RenameDialog.tsx` → `HelpDialog.tsx` → `HtmlPreviewDialog.tsx` → `MemoryDialog.tsx` → `ModelPickerDialog.tsx` → `SettingsDialog.tsx`

### 第14步：转换入口文件

- `App.jsx → App.tsx`
- `main.jsx → main.tsx`

### 第15步：更新配置文件

- **components.json**：`"tsx": false` → `"tsx": true`
- **eslint.config.js**：files 改为 `['**/*.{js,jsx,ts,tsx}']`，添加 `@typescript-eslint` 插件（可选，后续添加）
- **index.html**：`<script type="module" src="/src/main.jsx">` → `/src/main.tsx`

### 第16步：清理旧文件

删除所有已转换的 `.js`/`.jsx` 源文件（仅限 src/ 目录下的）。

### 第17步：验证

1. `npm run build` 通过
2. `npm run dev` 页面正常渲染
3. 无 TypeScript 编译错误
4. 功能无回归

## 关键决策

| 决策 | 选择 | 理由 |
|------|------|------|
| `strict` 模式 | 启用，但 `noUnusedLocals/Parameters: false` | 平衡类型安全与迁移效率 |
| 类型集中 vs 分散 | 集中在 `src/types/index.ts` | 项目规模适中，集中管理更清晰 |
| Store 类型定义方式 | `interface State + interface Actions + type Store = State & Actions` | Zustand 推荐模式，清晰分离 |
| `any` 类型 | 禁止使用 | 用户规则要求 |
| 迁移顺序 | 底层→上层（types → stores → lib → context → services → hooks → components → 入口） | 按依赖关系，确保每步可编译 |

## 风险与注意事项

1. **`?raw` 导入**：需在 `vite-env.d.ts` 中声明 `*.md?raw` 模块类型
2. **Zustand 跨 Store 引用**：`chatStore` 引用 `modelStore`、`agentStore`、`uiStore`，需确保被引用的 Store 先转换
3. **sonner toast 类型**：`toast[type]` 动态访问需类型断言或重写
4. **idb 库类型**：`idb` 自带 TypeScript 类型，无需额外安装
5. **Vite ESM + `__dirname`**：`vite.config.ts` 中 Vite 会自动注入 `__dirname`，但需 `@types/node`
6. **catch 空块**：多处 `catch {}` 在 strict 模式下需改为 `catch (_e) {}` 或 `catch { /* ignored */ }`
