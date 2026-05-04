# 计划：智能体列表重构

## 目标
1. 删除侧边栏中的 `agent-list` div
2. 将智能体选择功能并入智能体中心模态框
3. "新对话"按钮使用与"智能体"按钮相同的样式，但默认没有彩色背景

## 实现步骤

### 1. 修改 `index.html`
- 删除第48行的 `<div class="agent-list" id="agent-list"></div>`
- 将 `btn-agents` 按钮移动到 `sb-head` 内部，与 `btn-new` 并排显示

### 2. 修改 `css/sidebar.css`
- 修改 `.btn-new` 样式：
  - 移除蓝色背景 (`var(--accent-glow)`)
  - 移除蓝色边框
  - 使用透明背景和普通边框
  - 保持与 `.btn-agents` 相同的布局结构
  - 移除 `margin-top: 8px`（因为 `.btn-agents` 会移除这个）
- 调整 `.btn-agents` 样式：
  - 移除 `margin-top: 8px`
- 添加按钮容器的 flex 布局，使两个按钮并排显示
- 删除 `.agent-list` 相关样式（第127-156行）

### 3. 修改 `js/agents.js`
- 修改 `renderList()` 函数：
  - 不再渲染到 `agent-list` 容器
  - 改为在智能体中心模态框中添加"我的智能体"区域
- 修改 `renderPlaza()` 函数：
  - 在模态框顶部添加当前选择的智能体显示
  - 添加快速切换智能体的功能

### 4. 修改 `css/modals.css`
- 在智能体模态框中添加"当前智能体"或"我的智能体"区域样式

## 文件变更清单

| 文件 | 操作 |
|------|------|
| `index.html` | 删除 `agent-list` div，调整按钮位置 |
| `css/sidebar.css` | 修改按钮样式，删除 agent-list 样式 |
| `css/modals.css` | 添加智能体选择区域样式 |
| `js/agents.js` | 修改渲染逻辑 |
