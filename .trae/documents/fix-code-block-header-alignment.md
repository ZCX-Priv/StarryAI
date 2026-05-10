# 修复代码块头部布局问题

## 问题分析

用户选中的 `div` 元素（`.code-block-header`）使用了 `align-items: center`，导致其中的子元素（包括 `.code-block-actions` 这个 div）在垂直方向上**居中对齐**，而不是在顶部。

### 当前 CSS 样式

在 [chat.css:146-150](file:///c:\Users\赵晨旭\Desktop\AIChat\css\chat.css#L146-L150) 中：

```css
.code-block-header {
  display: flex; 
  align-items: center;          /* 这导致垂直居中对齐 */
  justify-content: space-between;
  padding: 7px 12px; 
  background: rgba(255,255,255,.04);
  border-bottom: 1px solid rgba(255,255,255,.07); 
  gap: 8px;
}
```

### HTML 结构

```html
<div class="code-block-header">
  <span class="code-block-lang">html</span>
  <div class="code-block-actions">
    <button class="code-block-toggle">展开</button>
    <button class="code-copy-btn">复制</button>
  </div>
</div>
```

## 解决方案

### 方案 1：使用 `align-items: flex-start`（推荐）

将 `.code-block-header` 的 `align-items` 属性改为 `flex-start`，使子元素在顶部对齐：

```css
.code-block-header {
  display: flex; 
  align-items: flex-start;      /* 改为顶部对齐 */
  justify-content: space-between;
  padding: 7px 12px; 
  background: rgba(255,255,255,.04);
  border-bottom: 1px solid rgba(255,255,255,.07); 
  gap: 8px;
}
```

**优点**：
- 子元素会在容器顶部对齐
- 保持了 flex 布局的其他特性
- 适用于不同高度的子元素

**缺点**：
- 可能会影响视觉平衡（如果内容高度不同）

### 方案 2：移除 `align-items` 属性

移除 `align-items: center`，使用默认值 `stretch`：

```css
.code-block-header {
  display: flex; 
  /* align-items: center; */    /* 移除此行 */
  justify-content: space-between;
  padding: 7px 12px; 
  background: rgba(255,255,255,.04);
  border-bottom: 1px solid rgba(255,255,255,.07); 
  gap: 8px;
}
```

**优点**：
- 子元素会被拉伸到容器高度
- 简单直接

**缺点**：
- 可能会导致按钮被拉伸变形
- 不适合包含不同类型元素的情况

### 方案 3：只针对特定元素调整

如果只想让 `.code-block-actions` 在顶部，可以给它添加 `align-self: flex-start`：

```css
.code-block-actions { 
  display: flex; 
  align-items: center; 
  gap: 4px; 
  flex-shrink: 0;
  align-self: flex-start;  /* 添加此行 */
}
```

**优点**：
- 不影响其他子元素
- 更精细的控制

**缺点**：
- 需要额外的 CSS 规则

## 推荐方案

**推荐使用方案 1**：将 `.code-block-header` 的 `align-items` 改为 `flex-start`。

这是最简单直接的解决方案，符合用户的需求，并且不会影响其他元素的布局。

## 实施步骤

1. 打开 [chat.css](file:///c:\Users\赵晨旭\Desktop\AIChat\css\chat.css) 文件
2. 找到第 147 行的 `.code-block-header` 样式规则
3. 将 `align-items: center;` 改为 `align-items: flex-start;`
4. 保存文件并刷新浏览器查看效果

## 预期效果

修改后，`.code-block-header` 内的所有子元素（包括 `.code-block-lang` 和 `.code-block-actions`）都会在容器的顶部对齐，而不是居中对齐。
