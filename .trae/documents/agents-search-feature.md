# 智能体搜索功能实施计划

## 需求概述
在智能体广场页面的分类标签上方添加一个搜索框，支持搜索智能体。

## 涉及文件
1. `index.html` - 添加搜索框 HTML 结构
2. `css/agents.css` - 添加搜索框样式
3. `js/agents.js` - 添加搜索功能逻辑

## 实施步骤

### 步骤 1: 修改 HTML 结构
在 `index.html` 的 `#agents-content` 中，在 `.agents-tabs` 上方添加搜索框容器：

```html
<div id="agents-content">
  <div id="my-agents-container"></div>
  <!-- 新增搜索框 -->
  <div class="agents-search">
    <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
    <input type="text" id="agents-search-input" placeholder="搜索智能体..." />
  </div>
  <!-- 原有分类标签 -->
  <div class="agents-tabs">...</div>
</div>
```

### 步骤 2: 添加 CSS 样式
在 `css/agents.css` 中添加搜索框样式：

```css
/* 搜索框样式 */
.agents-search {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 16px 20px 0;
  padding: 10px 14px;
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  transition: all .2s;
}

.agents-search:focus-within {
  border-color: var(--accent);
  background: var(--bg3);
}

.agents-search .search-icon {
  color: var(--text3);
  flex-shrink: 0;
}

.agents-search input {
  flex: 1;
  border: none;
  background: none;
  outline: none;
  font-size: 14px;
  color: var(--text);
  font-family: var(--font);
}

.agents-search input::placeholder {
  color: var(--text3);
}
```

### 步骤 3: 添加搜索逻辑
在 `js/agents.js` 中添加搜索功能：

1. 添加搜索状态变量
2. 添加 `searchAgents(keyword)` 方法 - 根据关键词过滤智能体
3. 添加 `initSearch()` 方法 - 初始化搜索事件监听
4. 在 `renderPlaza()` 中调用 `initSearch()`

搜索逻辑：
- 支持搜索智能体名称和描述
- 实时过滤（输入时即时响应）
- 搜索时保持当前分类过滤
- 清空搜索框时恢复显示

## 搜索功能交互设计
- 用户输入时实时过滤智能体列表
- 搜索范围：智能体名称 + 描述
- 搜索与分类标签联动：先按分类过滤，再按搜索词过滤
- 清空搜索框时恢复当前分类的全部智能体
