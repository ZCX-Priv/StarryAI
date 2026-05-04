# 智能体广场页面化改造计划

## 需求概述
将智能体广场从模态窗口改为独立页面，与对话页面平级，实现页面切换而非模态弹窗。

## 当前架构分析

### 现有结构
- **智能体广场**：模态窗口 `#agents-modal`，通过 `UI.openModal('agents')` 打开
- **对话页面**：主内容区 `#main`，包含 topbar、chat-area、input-area
- **侧边栏**：`#sidebar`，包含新对话按钮、智能体按钮、对话列表

### 相关文件
- `index.html` - 第 233-252 行定义了 `#agents-modal`
- `js/agents.js` - `renderPlaza()` 方法渲染智能体广场内容
- `js/ui.js` - `openModal()` 方法处理模态窗口打开
- `css/modals.css` - 第 120-227 行定义智能体广场模态样式

## 实施步骤

### 1. 修改 HTML 结构 (`index.html`)

#### 1.1 创建智能体广场页面容器
在 `#main` 同级位置添加 `#agents-page`：
```html
<!-- Agents Page -->
<div id="agents-page" class="page hidden">
  <!-- 顶部导航栏 -->
  <div id="agents-topbar">
    <button class="back-btn" onclick="UI.showPage('chat')">返回</button>
    <span class="page-title">智能体广场</span>
    <!-- 其他操作按钮 -->
  </div>
  
  <!-- 智能体广场内容 -->
  <div id="agents-content">
    <!-- 工具栏 -->
    <div class="agents-toolbar">...</div>
    <!-- 分类标签 -->
    <div class="agents-tabs">...</div>
    <!-- 智能体网格 -->
    <div class="agents-grid" id="agents-grid">...</div>
  </div>
</div>
```

#### 1.2 删除原有的模态窗口
移除 `#agents-modal` 及其内容（第 233-252 行）

### 2. 修改 CSS 样式

#### 2.1 创建页面样式 (`css/agents.css` 或在现有文件中添加)
```css
/* 页面容器 */
#agents-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg);
}

#agents-page.hidden {
  display: none;
}

/* 顶部导航栏 */
#agents-topbar {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  background: var(--bg2);
}

/* 内容区域 */
#agents-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

/* 智能体网格 - 从模态样式迁移 */
.agents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}
```

#### 2.2 迁移模态样式
将 `css/modals.css` 中智能体广场相关样式（第 120-227 行）迁移到新的页面样式中，并调整为全屏页面布局。

### 3. 修改 JavaScript 逻辑

#### 3.1 添加页面切换方法 (`js/ui.js`)
```javascript
showPage(page) {
  const mainPage = document.getElementById('main');
  const agentsPage = document.getElementById('agents-page');
  
  if (page === 'chat') {
    mainPage.classList.remove('hidden');
    agentsPage.classList.add('hidden');
  } else if (page === 'agents') {
    mainPage.classList.add('hidden');
    agentsPage.classList.remove('hidden');
    Agents.renderPlaza();
  }
}
```

#### 3.2 修改侧边栏按钮行为
将 `onclick="UI.openModal('agents')"` 改为 `onclick="UI.showPage('agents')"`

#### 3.3 修改 `Agents.useAgent()` 方法
选择智能体后，返回对话页面：
```javascript
useAgent(agentId) {
  // ... 现有逻辑
  UI.showPage('chat');  // 替换 UI.closeModal('agents-modal')
}
```

#### 3.4 删除模态相关代码
- 移除 `UI.openModal('agents')` 相关逻辑
- 清理 `closeModal('agents-modal')` 调用

### 4. 交互优化

#### 4.1 页面切换动画
添加平滑过渡效果：
```css
#main, #agents-page {
  transition: opacity 0.2s ease;
}
```

#### 4.2 移动端适配
确保在移动端侧边栏正常工作，页面切换时自动关闭侧边栏。

## 文件修改清单

| 文件 | 修改内容 |
|------|----------|
| `index.html` | 添加 `#agents-page`，删除 `#agents-modal`，修改按钮事件 |
| `css/agents.css` | 新建文件，包含智能体广场页面样式 |
| `css/modals.css` | 删除智能体广场模态相关样式 |
| `js/ui.js` | 添加 `showPage()` 方法，修改 `openModal()` |
| `js/agents.js` | 修改 `useAgent()` 方法，调整渲染逻辑 |

## 预期效果

1. 点击侧边栏"智能体"按钮，整个页面切换到智能体广场
2. 智能体广场作为独立页面，有更大的展示空间
3. 选择智能体后自动返回对话页面
4. 页面切换流畅，体验一致
