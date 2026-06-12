# 模型选择器按钮宽度修复计划

## 问题分析
在移动端，当选择较长的模型名称（如 "gemini-1.5-flash-lite-search"）时，模型选择器按钮会变得过宽，影响界面美观和布局。

## 解决方案
通过 CSS 限制按钮宽度，并在文本过长时显示省略号。

## 修改内容
- **文件**: `src/index.css`
- **目标**: 修改 `.model-pill` 及其子元素的样式

## 具体步骤
1. 为 `.model-pill` 添加 `max-width` 限制
2. 设置 `overflow: hidden`
3. 为 `.model-pill span` 添加 `text-overflow: ellipsis` 和 `white-space: nowrap`
4. 在移动端响应式样式中添加额外的宽度限制

## 风险评估
- 低风险：仅修改 CSS 样式，不影响功能逻辑