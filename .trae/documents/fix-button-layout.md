# 修复按钮布局计划

## 问题分析

当前两个按钮（"新对话" 和 "智能体"）是水平排列的，用户希望它们垂直排列。

### 当前代码结构

**HTML** ([index.html:39-48](file:///c:/Users/赵晨旭/Desktop/AIChat/index.html#L39-L48)):
```html
<div class="sb-btns">
  <button class="btn-new" onclick="Chat.create()">...</button>
  <button class="btn-agents" onclick="UI.openModal('agents')">...</button>
</div>
```

**CSS** ([sidebar.css:31-33](file:///c:/Users/赵晨旭/Desktop/AIChat/css/sidebar.css#L31-L33)):
```css
.sb-btns {
  display: flex; gap: 8px;
}
```

### 问题原因

`.sb-btns` 使用 `display: flex`，默认的 `flex-direction` 是 `row`（水平方向），导致按钮水平排列。

## 解决方案

修改 `css/sidebar.css` 文件中的 `.sb-btns` 样式，添加 `flex-direction: column` 使按钮垂直排列。

### 具体修改

**文件**: `css/sidebar.css`

**修改前**:
```css
.sb-btns {
  display: flex; gap: 8px;
}
```

**修改后**:
```css
.sb-btns {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
```

## 实施步骤

1. 编辑 `css/sidebar.css` 文件
2. 在 `.sb-btns` 规则中添加 `flex-direction: column`
3. 验证修改效果

## 预期结果

修改后，"新对话" 按钮和 "智能体" 按钮将垂直堆叠排列，而不是水平并排。
