# 智能体广场布局重构计划

## 目标
将智能体广场改为与对话页面相同的布局结构，共享侧边栏，删除返回按钮，添加侧边栏切换按钮。

## 当前结构分析

### 对话页面 (`#app`)
- 包含侧边栏 (`#sidebar`)
- 主内容区 (`#main`) 包含顶部栏、聊天区域、输入区域
- 顶部栏有侧边栏切换按钮 (`#sb-toggle-btn`)

### 智能体广场 (`#agents-page`)
- 全屏覆盖页面 (`position: fixed`)
- 独立的顶部栏 (`#agents-topbar`)，包含返回按钮
- 内容区域 (`#agents-content`)

## 实现步骤

### 1. 修改 HTML 结构 (index.html)
- 将 `#agents-page` 移入 `#app` 内部，与 `#main` 同级
- 删除 `agents-back-btn` 返回按钮
- 在 `#agents-topbar` 添加侧边栏切换按钮（复制 `tb-toggle` 样式）
- 调整 `#agents-page` 的 CSS 类，使其与 `#main` 类似的布局

### 2. 修改 CSS 样式 (css/agents.css)
- 移除 `#agents-page` 的 `position: fixed` 全屏样式
- 改为与 `#main` 相同的 flex 布局
- 添加侧边栏切换按钮样式（复用 `.tb-toggle`）
- 删除 `.agents-back-btn` 相关样式
- 调整 `#agents-topbar` 样式，使其与 `#topbar` 类似

### 3. 修改 JavaScript 逻辑 (js/ui.js)
- 修改 `UI.showPage()` 函数
- 切换页面时不再隐藏整个 `#app`，而是切换 `#main` 和 `#agents-page` 的显示
- 确保侧边栏在两个页面间保持状态

### 4. 修改 CSS 变量/基础样式 (如需要)
- 确保页面切换动画流畅
- 统一两个页面的顶部栏高度和样式

## 文件修改清单

| 文件 | 修改内容 |
|------|----------|
| `index.html` | 重构 `#agents-page` 结构，删除返回按钮，添加侧边栏切换按钮 |
| `css/agents.css` | 修改布局样式，删除返回按钮样式，添加切换按钮样式 |
| `js/ui.js` | 修改 `showPage()` 函数逻辑 |

## 预期效果

1. 智能体广场与对话页面共享同一个侧边栏
2. 两个页面可以通过侧边栏中的"智能体"按钮和对话列表切换
3. 智能体广场顶部栏有侧边栏打开/收起按钮
4. 删除原有的返回按钮
