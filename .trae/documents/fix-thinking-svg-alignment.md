# 修复 ThinkingBlock 按钮图标与文字垂直对齐

## Summary
"思考过程"按钮中的 SVG 图标与文字视觉上不在同一行，需要修复垂直对齐。

## Current State
- 文件：`src/render/ThinkingBlock.tsx`
- 按钮使用 `display: flex; alignItems: center`，理论上应垂直居中
- 左侧 SVG `width="14" height="14"`，右侧箭头 SVG `width="10" height="10"`
- 问题：SVG 作为内联元素，其默认 `vertical-align: baseline` 可能导致与文字基线不对齐，且 SVG 的对齐方式受 `display` 属性影响

## Proposed Changes
- **文件**：`src/render/ThinkingBlock.tsx`
- **改动**：给两个 SVG 的 style 添加 `display: 'block'`，确保 flex 布局下正确垂直居中
- **原因**：SVG 默认是 `display: inline`，在 flex 容器中会有基线对齐的偏移问题，设为 `block` 后 flex 的 `alignItems: center` 才能正确生效

## Verification
- 启动 dev server，查看"思考过程"按钮图标是否与文字在同一水平线上
