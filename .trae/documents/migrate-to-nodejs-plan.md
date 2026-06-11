# 星语（AIChat）原版迁移至 React+Vite 计划

## 概述

将 `原版/` 目录下的纯原生 HTML+CSS+JS 项目迁移为 React + Vite + Tailwind CSS + ShadcnUI 技术栈，放置在新建的 `NodeJS/` 文件夹中。

## 当前状态分析

### 原版技术栈
- 纯原生 HTML + CSS + JavaScript（无框架、无构建工具）
- 全局变量 + 对象字面量模式（非 ES Module）
- CSS 变量实现主题系统（深色/浅色/自动）
- IndexedDB + localStorage 双存储层
- Pollinations.ai API（OpenAI 兼容格式），流式 SSE 响应
- Canvas 蜂巢背景动画
- 纯文本渲染器（当前简化版）

### 原版核心功能清单
1. AI 对话聊天（流式响应、停止生成、重新生成、复制回复）
2. 多模型支持（40+ 模型，含搜索、分类标签）
3. 三种对话模式（快速/思考/专家）
4. 智能体系统（预设3个 + 自定义创建/删除/分类/搜索）
5. 横幅快捷操作（6种场景模式：图像/解题/翻译/编程/研究/分析）
6. AI 记忆系统（自动提取/去重/编辑/删除，最多20条）
7. 主题切换（深色/浅色/自动）
8. 蜂巢背景动画（Canvas）
9. 模型参数调节（温度/Top P/上下文长度）
10. 密钥管理（多密钥、激活/删除）
11. 对话管理（创建/切换/重命名/删除）
12. 时间感知（公历+农历+节气+节日）
13. 数据迁移（localStorage → IndexedDB）
14. HTML 预览（iframe 沙箱）
15. 账户系统（余额/等级查询）

### 原版文件结构映射
```
原版/
├── index.html              → 主入口
├── css/                    → 9个CSS文件
├── js/                     → 21个JS文件
│   ├── config.js           → API地址、存储键名、默认模型
│   ├── state.js            → 全局状态对象
│   ├── api.js              → API通信（流式/非流式）
│   ├── chat.js             → 对话CRUD、发送、流式处理
│   ├── ui.js               → UI交互控制
│   ├── agents.js           → 智能体广场
│   ├── banner.js           → 横幅快捷操作
│   ├── modals.js           → 所有模态框
│   ├── keys.js             → 密钥/模型管理
│   ├── prompts.js          → 提示词加载/模板
│   ├── canvas.js           → 蜂巢背景+侧边栏
│   ├── store-idb.js        → IndexedDB存储
│   ├── store-migrate.js    → 数据迁移
│   ├── store-theme-account.js → 存储/主题/账户
│   ├── render/index.js     → 渲染器（纯文本）
│   ├── context/            → 上下文构建
│   │   ├── index.js        → 上下文入口
│   │   ├── memory.js       → 记忆提取/去重
│   │   ├── system-prompt.js → 系统提示词
│   │   └── time.js         → 时间信息（农历）
│   └── mode/               → 模式配置
│       ├── fast.js
│       ├── thinking.js
│       └── expert.js
├── config/                 → JSON配置
│   ├── agents.json
│   └── banner.json
├── prompts/                → Markdown提示词模板
├── image/agents/           → 智能体头像
├── models.json             → 模型列表
└── logo.png                → 应用Logo
```

## 迁移方案

### 技术栈选型

| 层面 | 技术 | 说明 |
|------|------|------|
| 构建工具 | Vite | 快速HMR，React官方推荐 |
| UI框架 | React 18+ | 函数组件 + Hooks |
| 样式 | Tailwind CSS v4 | 原子化CSS，配合CSS变量 |
| 组件库 | ShadcnUI (Radix UI) | 高质量可定制组件 |
| 图标 | Lucide React | ShadcnUI默认图标库，覆盖原版所有SVG图标 |
| 状态管理 | Zustand | 轻量级，替代全局state对象 |
| 路由 | React Router v7 | SPA页面切换（聊天/智能体） |
| Markdown渲染 | react-markdown + rehype | 替代纯文本渲染器 |
| 代码高亮 | rehype-highlight | 代码块语法高亮 |
| 流式响应 | 原生fetch + ReadableStream | 保持原版SSE逻辑 |
| 数据存储 | idb | 轻量级 IndexedDB 封装（注意：idb 和 Dexie 是两个不同的库，这里使用 idb） |
| 农历计算 | 直接迁移 time.js | 保留原版农历算法 |

### 目标目录结构

```
NodeJS/
├── public/
│   ├── logo.png
│   └── agents/                    # 智能体头像
│       ├── assistant.png
│       ├── coder.png
│       └── writer.png
├── src/
│   ├── main.jsx                   # 入口
│   ├── App.jsx                    # 根组件（路由+布局）
│   ├── index.css                  # Tailwind + CSS变量 + 全局样式
│   │
│   ├── components/
│   │   ├── ui/                    # ShadcnUI组件（自动生成）
│   │   │   ├── button.jsx
│   │   │   ├── dialog.jsx
│   │   │   ├── dropdown-menu.jsx
│   │   │   ├── input.jsx
│   │   │   ├── select.jsx
│   │   │   ├── slider.jsx
│   │   │   ├── tabs.jsx
│   │   │   ├── textarea.jsx
│   │   │   ├── toast.jsx
│   │   │   ├── toggle.jsx
│   │   │   └── tooltip.jsx
│   │   │
│   │   ├── layout/
│   │   │   ├── AppShell.jsx       # 主布局（侧边栏+主内容）
│   │   │   ├── Sidebar.jsx        # 侧边栏
│   │   │   ├── Topbar.jsx         # 顶栏
│   │   │   └── HoneycombCanvas.jsx # 蜂巢背景Canvas
│   │   │
│   │   ├── chat/
│   │   │   ├── ChatArea.jsx       # 聊天区域容器
│   │   │   ├── MessageList.jsx    # 消息列表
│   │   │   ├── MessageBubble.jsx  # 单条消息气泡
│   │   │   ├── MessageActions.jsx # 消息操作（重新生成/复制）
│   │   │   ├── InputArea.jsx      # 输入区域
│   │   │   ├── ModeSelector.jsx   # 模式选择下拉（快速/思考/专家）
│   │   │   ├── StreamStatus.jsx   # 流式状态指示器
│   │   │   └── EmptyState.jsx     # 空对话欢迎页
│   │   │
│   │   ├── agents/
│   │   │   ├── AgentsPage.jsx     # 智能体广场页面
│   │   │   ├── AgentCard.jsx      # 智能体卡片
│   │   │   ├── AgentSearch.jsx    # 智能体搜索
│   │   │   ├── CategoryTabs.jsx   # 分类标签
│   │   │   ├── CreateAgentDialog.jsx  # 创建智能体对话框
│   │   │   └── CreateCategoryDialog.jsx # 创建分类对话框
│   │   │
│   │   └── modals/
│   │       ├── SettingsDialog.jsx  # 设置对话框（外观/模型/密钥）
│   │       ├── MemoryDialog.jsx    # 记忆对话框
│   │       ├── ModelPickerDialog.jsx # 模型选择对话框
│   │       ├── HelpDialog.jsx      # 帮助中心对话框
│   │       ├── HtmlPreviewDialog.jsx # HTML预览对话框
│   │       ├── RenameDialog.jsx    # 重命名对话框
│   │       └── ConfirmDeleteDialog.jsx # 确认删除对话框
│   │
│   ├── hooks/
│   │   ├── useChat.js             # 对话管理Hook
│   │   ├── useStream.js           # 流式响应Hook
│   │   ├── useMemory.js           # 记忆管理Hook
│   │   ├── useTheme.js            # 主题Hook
│   │   ├── useAgents.js           # 智能体Hook
│   │   ├── useBanner.js           # 横幅快捷操作Hook
│   │   ├── useModels.js           # 模型管理Hook
│   │   ├── useKeys.js             # 密钥管理Hook
│   │   ├── useAccount.js          # 账户余额/等级Hook
│   │   └── useStore.js            # IndexedDB存储Hook
│   │
│   ├── context/                   # 上下文构建系统（完整迁移自原版 js/context/）
│   │   ├── index.js               # 上下文入口，统一导出 buildSystemPrompt/buildMessages 等
│   │   ├── systemPrompt.js        # 系统提示词组装（模板→模式→智能体→横幅→记忆→时间）
│   │   ├── memory.js              # 记忆提取与去重（调用 AI 自动提取）
│   │   └── time.js                # 时间信息（公历+农历+节气+节日，完整农历算法）
│   │
│   ├── services/
│   │   ├── api.js                 # API通信层（流式/非流式）
│   │   ├── storage.js             # IndexedDB存储层（idb库）
│   │   └── migration.js           # 数据迁移服务
│   │
│   ├── store/
│   │   └── useAppStore.js         # Zustand全局状态
│   │
│   ├── lib/
│   │   ├── utils.js               # 工具函数（cn等）
│   │   ├── prompts.js             # 提示词加载/模板解析
│   │   └── renderer.js            # Markdown渲染器配置（react-markdown + rehype-highlight）
│   │
│   ├── data/
│   │   ├── agents.json            # 智能体配置
│   │   ├── banner.json            # 横幅配置
│   │   └── models.json            # 模型列表（静态备用）
│   │
│   └── prompts/                   # 提示词模板（Markdown）
│       ├── soul.md
│       ├── memory-extract.md
│       ├── memory-deduplicate.md
│       ├── agents/
│       ├── banner/
│       └── mode/
│
├── components.json                # ShadcnUI配置
├── tailwind.config.js
├── vite.config.js
├── package.json
└── index.html
```

### 实施步骤

#### 第一阶段：项目初始化

1. **创建 NodeJS 目录并初始化 Vite + React 项目**
   - `npm create vite@latest NodeJS -- --template react`
   - 安装核心依赖：`react-router-dom`, `zustand`, `lucide-react`, `idb`
   - 安装 Tailwind CSS v4：`tailwindcss @tailwindcss/vite`
   - 初始化 ShadcnUI：`npx shadcn@latest init`
   - 安装所需 ShadcnUI 组件：`npx shadcn@latest add button dialog dropdown-menu input select slider tabs textarea toast toggle tooltip`

2. **配置基础架构**
   - 配置 `vite.config.js`（Tailwind插件、路径别名）
   - 配置 `tailwind.config.js`（自定义颜色、CSS变量映射）
   - 设置 `index.css`（CSS变量主题系统，迁移自 `variables.css`）
   - 配置 `components.json`（ShadcnUI）

3. **复制静态资源**
   - 复制 `logo.png` → `public/logo.png`
   - 复制 `image/agents/` → `public/agents/`
   - 复制 `config/*.json` → `src/data/`
   - 复制 `prompts/` → `src/prompts/`

#### 第二阶段：核心服务层

4. **实现 Zustand 状态管理** (`store/useAppStore.js`)
   - 迁移 `state.js` 中的全局状态
   - 包含：keys, activeKey, chats, activeChatId, memory, theme, model, models, isStreaming, stopRequested, autoScroll, honeycomb, currentMode, modeConfig, temperature, topP, contextLength, currentAgentId, currentBannerMode 等

5. **实现 IndexedDB 存储层** (`services/storage.js`)
   - 使用 `idb` 库封装（比原版更简洁）
   - 5个ObjectStore：config, chats, memory, keys, agents
   - 迁移 `store-idb.js` 的所有方法

6. **实现数据迁移服务** (`services/migration.js`)
   - 迁移 `store-migrate.js` 逻辑

7. **实现 API 通信层** (`services/api.js`)
   - 迁移 `api.js` 的流式/非流式请求
   - reasoning 内容提取逻辑
   - 密钥验证

8. **实现提示词系统** (`lib/prompts.js`)
   - 迁移 `prompts.js` 的模板加载和变量替换
   - 模板解析：`parsePromptTemplate()`, `extractSection()`, `buildSystemPromptFromTemplate()`
   - 提示词加载：`loadMainPrompt()`, `loadMemoryPrompts()`, `loadModePrompt()`

9. **实现 Context 上下文构建系统** (`context/`)
   - **`context/time.js`**：完整迁移原版 `time.js`，包含：
     - 农历算法：`lunarInfo` 数组、`solar2lunar()`、`lYearDays()`、`leapMonth()`、`leapDays()`、`monthDays()` 等
     - 节气计算：`solarTerms`、`solarTermInfo`、`getSolarTerm()`
     - 节日查询：`solarFestivals`、`lunarFestivals`、`getFestival()`
     - 时间信息生成：`getCurrentTimeInfo()` 返回含公历+农历+节气+节日的完整字符串
   - **`context/systemPrompt.js`**：完整迁移原版 `system-prompt.js`，包含：
     - `buildSystemPrompt()`：按优先级拼接（模板提示→模式提示→智能体提示→横幅提示→记忆→时间信息）
     - `buildMemoryExtractPrompt()`：构建记忆提取提示词
     - `buildMemoryDeduplicatePrompt()`：构建记忆去重提示词
     - `buildMessages()`：在消息数组前插入 system 角色消息
   - **`context/memory.js`**：完整迁移原版 `memory.js`，包含：
     - `extractMemory()`：从最近6条消息中提取新记忆（调用 nova-fast 模型）
     - `deduplicateMemory()`：记忆去重合并（≥5条时触发，调用 nova-fast 模型）
     - `clearMemory()`、`editMemoryItem()`、`deleteMemoryItem()`
   - **`context/index.js`**：统一导出入口，与原版 `context/index.js` 对应

#### 第三阶段：自定义 Hooks

10. **实现核心 Hooks**
   - `useStore.js` - IndexedDB初始化和数据加载
   - `useChat.js` - 对话CRUD、发送消息、流式响应
   - `useStream.js` - 流式响应状态管理
   - `useMemory.js` - 记忆管理
   - `useTheme.js` - 主题切换（深色/浅色/自动，迁移自 `store-theme-account.js` 的 Theme 对象）
   - `useAgents.js` - 智能体管理（加载配置、选择、创建、删除、搜索、分类）
   - `useBanner.js` - 横幅快捷操作（加载配置、渲染按钮、处理模式切换、更多下拉）
   - `useModels.js` - 模型列表加载和搜索
   - `useKeys.js` - 密钥管理（添加、激活、删除）
   - `useAccount.js` - 账户余额/等级查询（迁移自 `store-theme-account.js` 的 Account 对象）

#### 第四阶段：UI 组件

11. **布局组件**
    - `AppShell.jsx` - 主布局（侧边栏+主内容区）
    - `Sidebar.jsx` - 侧边栏（Logo、新对话按钮、智能体按钮、对话列表、设置按钮）
    - `Topbar.jsx` - 顶栏（汉堡菜单、标题、记忆按钮、模型选择、主题切换）
    - `HoneycombCanvas.jsx` - 蜂巢背景Canvas

12. **聊天组件**
    - `ChatArea.jsx` - 聊天区域容器
    - `MessageList.jsx` - 消息列表
    - `MessageBubble.jsx` - 消息气泡（用户/AI，含思考块渲染）
    - `MessageActions.jsx` - 重新生成/复制按钮
    - `InputArea.jsx` - 输入区域（文本框+附件+模式选择+横幅操作+发送/停止）
    - `ModeSelector.jsx` - 模式下拉（快速/思考/专家）
    - `StreamStatus.jsx` - 流式状态指示
    - `EmptyState.jsx` - 空对话欢迎页

13. **智能体组件**
    - `AgentsPage.jsx` - 智能体广场页面
    - `AgentCard.jsx` - 智能体卡片
    - `AgentSearch.jsx` - 搜索框
    - `CategoryTabs.jsx` - 分类标签
    - `CreateAgentDialog.jsx` - 创建智能体对话框
    - `CreateCategoryDialog.jsx` - 创建分类对话框

14. **对话框组件**
    - `SettingsDialog.jsx` - 设置（外观/模型/密钥三个Tab）
    - `MemoryDialog.jsx` - 记忆管理
    - `ModelPickerDialog.jsx` - 模型选择器（含搜索）
    - `HelpDialog.jsx` - 帮助中心
    - `HtmlPreviewDialog.jsx` - HTML预览
    - `RenameDialog.jsx` - 重命名
    - `ConfirmDeleteDialog.jsx` - 确认删除

#### 第五阶段：路由和集成

15. **实现路由和页面切换**
    - React Router 配置（聊天页/智能体页）
    - App.jsx 根组件

16. **集成测试和调试**
    - 验证所有功能正常
    - 流式响应测试
    - 主题切换测试
    - 数据持久化测试

### UI 设计原则：严格还原原版

**核心原则**：React 版本的 UI 必须与原版在视觉上保持一致，不引入原版没有的视觉变化。

1. **CSS 变量完全保留**：原版 `variables.css` 中的所有设计令牌（颜色、圆角、字体、间距）原封不动迁移到 `index.css`
2. **布局结构不变**：侧边栏宽度 268px、顶栏高度、输入区域布局、气泡样式等全部保持原版尺寸
3. **组件样式还原**：每个组件的 Tailwind 类名需要精确还原原版 CSS 的视觉效果
4. **动画效果保留**：模态框动画、Toast 动画、打字指示器动画、滚动按钮动画等
5. **ShadcnUI 仅用于交互能力**：Dialog 的开/关逻辑、Dropdown 的定位、Slider 的拖拽等，视觉样式覆盖为原版风格
6. **响应式断点保持**：680px 移动端适配逻辑不变

### Context 处理系统（完整迁移）

原版 `js/context/` 目录是核心的上下文构建系统，负责组装发送给 AI 的完整上下文。必须完整迁移：

```
原版 context/          →  NodeJS src/context/
├── index.js           →  context/index.js       # 上下文入口，统一导出
├── system-prompt.js   →  context/systemPrompt.js # 系统提示词组装
├── memory.js          →  context/memory.js       # 记忆提取与去重
└── time.js            →  context/time.js         # 时间信息（农历/节气/节日）
```

**详细映射**：

| 原版模块 | 迁移目标 | 功能说明 |
|---------|---------|---------|
| `context/index.js` - `Context.buildSystemPrompt()` | `context/index.js` - `buildSystemPrompt()` | 组装完整系统提示词 |
| `context/index.js` - `Context.buildMessages(msgs)` | `context/index.js` - `buildMessages(msgs)` | 构建含系统提示的消息数组 |
| `context/index.js` - `Context.buildMemoryExtractPrompt()` | `context/index.js` - `buildMemoryExtractPrompt()` | 构建记忆提取提示词 |
| `context/index.js` - `Context.buildMemoryDeduplicatePrompt()` | `context/index.js` - `buildMemoryDeduplicatePrompt()` | 构建记忆去重提示词 |
| `context/system-prompt.js` - `SystemPrompt.buildSystemPrompt()` | `context/systemPrompt.js` - `buildSystemPrompt()` | 按优先级组装：模板提示→模式提示→智能体提示→横幅提示→记忆→时间信息 |
| `context/system-prompt.js` - `SystemPrompt.buildMessages()` | `context/systemPrompt.js` - `buildMessages()` | 在消息数组前插入 system 角色消息 |
| `context/memory.js` - `MemoryManager.extract()` | `context/memory.js` - `extractMemory()` | 从最近6条消息中提取新记忆（调用 nova-fast 模型） |
| `context/memory.js` - `MemoryManager.deduplicate()` | `context/memory.js` - `deduplicateMemory()` | 记忆去重合并（≥5条时触发，调用 nova-fast 模型） |
| `context/time.js` - `Time.getCurrentTimeInfo()` | `context/time.js` - `getCurrentTimeInfo()` | 生成含公历+农历+节气+节日的时间字符串 |
| `context/time.js` - 整个农历算法 | `context/time.js` - 完整保留 | lunarInfo数组、solar2lunar()、getSolarTerm()、getFestival() 等 |

**Context 处理流程（与原版一致）**：
1. 用户发送消息 → `useChat.send()` 
2. 获取当前对话的消息历史 → 按 `contextLength` 截取
3. `buildMessages(msgs)` → 先调用 `buildSystemPrompt()` 组装系统提示词
4. `buildSystemPrompt()` 按优先级拼接：
   - 主提示词模板（`soul.md`）
   - 模式提示词（`mode/fast.md` 等）
   - 智能体提示词（`agents/assistant.md` 等）
   - 横幅提示词（`banner/image.md` 等）
   - 用户记忆（从 Zustand store 读取 `state.memory`）
   - 时间信息（`getCurrentTimeInfo()` 含农历）
5. 返回 `[{role:'system', content:系统提示}, ...用户消息]`
6. 发送到 API → 流式响应
7. 响应完成后 → `extractMemory()` 从最近6条消息提取新记忆
8. 记忆≥5条时 → `deduplicateMemory()` 去重合并

### 关键设计决策

1. **图标方案**：使用 Lucide React（ShadcnUI 默认图标库），原版所有内联 SVG 图标都有对应的 Lucide 图标
   - Plus → 新对话
   - Users → 智能体
   - Settings → 设置
   - Brain → 记忆
   - Sun/Moon → 主题
   - ArrowUp → 发送
   - Square → 停止
   - Zap → 快速模式
   - Layers → 思考模式
   - Sparkles → 专家模式
   - Search → 搜索
   - X → 关闭
   - ChevronDown → 下拉箭头
   - MoreHorizontal → 更多操作
   - Pencil → 编辑
   - Trash2 → 删除
   - Copy → 复制
   - RefreshCw → 重新生成
   - Paperclip → 附件
   - MessageSquare → 对话图标

2. **状态管理**：Zustand 替代全局 `state` 对象，更符合 React 范式

3. **样式方案**：Tailwind CSS + CSS 变量（保留原版设计令牌），ShadcnUI 组件覆盖样式还原原版视觉

4. **渲染器升级**：从纯文本渲染器升级为 react-markdown + rehype-highlight，支持 Markdown 和代码高亮

5. **存储方案**：使用 `idb` 库替代手写 IndexedDB 封装，更简洁可靠

6. **对话框方案**：使用 ShadcnUI 的 Dialog 组件替代自定义模态框，视觉样式覆盖为原版风格

7. **提示词文件**：作为静态资源放在 `src/prompts/` 下，通过 Vite 的 `?raw` import 或 fetch 加载

8. **Context 系统独立模块**：`src/context/` 目录保持与原版 `js/context/` 对应的独立结构，不混入其他模块

### 验证步骤

1. 启动开发服务器，确认页面正常渲染
2. 测试对话创建/切换/删除/重命名
3. 测试流式响应（发送消息、停止生成、重新生成）
4. 测试模型切换和参数调节
5. 测试三种对话模式切换
6. 测试智能体选择/创建/删除/搜索/分类
7. 测试横幅快捷操作
8. 测试记忆管理（查看/编辑/删除/清除）
9. 测试主题切换（深色/浅色/自动）
10. 测试密钥管理（添加/激活/删除）
11. 测试蜂巢背景动画
12. 测试数据持久化（刷新页面后数据保留）
13. 测试响应式布局（移动端侧边栏）
