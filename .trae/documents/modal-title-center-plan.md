# 模态框标题居中实施计划

## 问题分析

当前模态框标题区域 (`.modal-hd`) 使用 `justify-content: space-between` 布局，导致标题靠左显示。每个模态框标题区域包含：
- `.modal-title` - 标题文本
- `.icon-btn` - 关闭按钮（X 图标）

## 涉及文件

- `css/modals.css` - 模态框样式文件

## 实施方案

使用绝对定位方式实现标题居中，无需修改 HTML 结构：

### 修改 `css/modals.css`

1. **修改 `.modal-hd` 样式**
   - 将 `justify-content: space-between` 改为 `justify-content: center`
   - 添加 `position: relative` 以支持子元素绝对定位

2. **修改 `.modal-title` 样式**
   - 添加 `text-align: center` 确保文本居中

3. **修改关闭按钮样式**
   - 让 `.modal-hd .icon-btn` 使用绝对定位
   - 设置 `position: absolute; right: 22px;` 将按钮固定在右侧

## 具体代码变更

```css
/* 修改前 */
.modal-hd {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 22px 0; flex-shrink: 0;
}
.modal-title { font-size: 17px; font-weight: 600; }

/* 修改后 */
.modal-hd {
  display: flex; align-items: center; justify-content: center;
  padding: 20px 22px 0; flex-shrink: 0;
  position: relative;
}
.modal-title { font-size: 17px; font-weight: 600; text-align: center; }
.modal-hd .icon-btn { position: absolute; right: 22px; }
```

## 影响范围

此修改将影响以下所有模态框的标题显示：
- 设置模态框 (settings-modal)
- 记忆模态框 (memory-modal)
- 帮助中心模态框 (help-modal)
- 模型选择模态框 (model-modal)
- 智能体广场模态框 (agents-modal)

## 验证步骤

1. 打开各个模态框，确认标题已居中显示
2. 确认关闭按钮仍在右侧且功能正常
3. 确认响应式布局下标题仍居中
