# 计划：分类标签选中蓝色 + 智能体"当前"标识

## 概述
1. 将分类标签（agent-tab）的选中态从反色改为蓝色
2. 为当前选中的智能体卡片添加"当前"框选边框与文字标识

## 当前状态分析

### 分类标签选中样式
- 文件：`src/index.css` 第 384 行
- 当前样式：`.agent-tab.active { background: var(--text); color: var(--bg); border-color: var(--text); }` — 反色设计（深色背景+浅色文字）
- 项目中蓝色主题变量：`--accent: #3b82f6; --accent2: #60a5fa; --accent-glow: rgba(59,130,246,0.20);`

### 智能体卡片
- 文件：`src/components/agents/AgentCard.tsx` — 不接收 `currentAgentId`，无当前选中标识
- 文件：`src/components/agents/AgentsPage.tsx` — 不传递 `currentAgentId` 给 `AgentCard`
- 状态：`agentStore.currentAgentId` 已存在，可在 AgentsPage 中读取

## 修改方案

### 1. 修改分类标签选中样式为蓝色
**文件**: `src/index.css` 第 384 行

将：
```css
.agent-tab.active { background: var(--text); color: var(--bg); border-color: var(--text); }
```
改为：
```css
.agent-tab.active { background: var(--accent); color: #fff; border-color: var(--accent); }
```

同时添加亮色主题覆盖（如需要），在 light theme overrides 区域添加：
```css
[data-theme="light"] .agent-tab.active { background: var(--accent); color: #fff; border-color: var(--accent); }
```

### 2. 为智能体卡片添加"当前"标识

#### 2a. 修改 `AgentCard.tsx`
- Props 接口新增 `isCurrent?: boolean`
- 当 `isCurrent` 为 true 时：
  - 卡片容器追加 `current-agent` 类名
  - 在名称旁添加 `<span className="current-agent-badge">当前</span>`（与 `custom-agent-badge` 风格一致）

#### 2b. 修改 `AgentsPage.tsx`
- 从 `useAgentStore` 读取 `currentAgentId`
- 将 `isCurrent={agent.id === currentAgentId}` 传递给 `AgentCard`

#### 2c. 在 `src/index.css` 添加样式
```css
.agent-card.current-agent { border-color: var(--accent); background: var(--accent-glow); }
.current-agent-badge { display: inline-block; padding: 2px 6px; background: var(--accent); color: #fff; font-size: 10px; font-weight: 600; border-radius: 4px; margin-left: 6px; }
```

## 验证步骤
1. `npx tsc --noEmit` 无类型错误
2. `npm run lint` 无 lint 错误
3. 打开智能体广场，确认分类标签选中态为蓝色
4. 选择一个智能体后重新进入智能体广场，确认该智能体卡片有蓝色边框 + "当前"徽章
