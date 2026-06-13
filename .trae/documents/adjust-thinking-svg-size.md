# 调整 ThinkingBlock 按钮 SVG 图标大小

## Summary
将"思考过程"按钮中的左侧 SVG 图标从 12px 调大到 14px，使其与 12px 文字视觉上等高。

## Current State
- 文件：`src/render/ThinkingBlock.tsx`
- 按钮 `fontSize: '12px'`，左侧 SVG 为 `width="12" height="12"`
- SVG 视觉上比文字小，不够协调

## Proposed Changes
- **文件**：`src/render/ThinkingBlock.tsx` 第 22 行
- **改动**：将左侧 SVG 的 `width="12" height="12"` 改为 `width="14" height="14"`
- **原因**：12px 的 SVG 在视觉上比 12px 文字小，14px 更接近文字视觉高度

## Verification
- 启动 dev server，查看"思考过程"按钮图标是否与文字视觉对齐
