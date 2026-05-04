# 调整创建智能体按钮位置

## 需求
1. 将"创建 AI 智能体"按钮移动到搜索框右侧
2. 移动端只显示加号图标（隐藏文字）

## 涉及文件
1. `index.html` - 调整 HTML 结构
2. `css/agents.css` - 调整样式和响应式布局

## 实施步骤

### 步骤 1: 修改 HTML 结构
将按钮从 `.agents-tabs` 移动到 `.agents-search` 内部：

```html
<div class="agents-search-wrapper">
  <div class="agents-search">
    <svg class="search-icon">...</svg>
    <input type="text" id="agents-search-input" placeholder="搜索智能体..." />
    <button class="search-clear-btn">...</button>
  </div>
  <button class="btn-sm primary create-agent-btn">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
    <span>创建 AI 智能体</span>
  </button>
</div>
```

### 步骤 2: 修改 CSS 样式
添加搜索区域包装器样式：
- 搜索框和按钮水平排列
- 搜索框占据剩余空间
- 按钮固定宽度

### 步骤 3: 添加响应式样式
移动端（max-width: 680px）：
- 按钮只显示图标，隐藏文字
- 按钮变为圆形图标按钮
