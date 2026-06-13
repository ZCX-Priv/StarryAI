# 修复思考图标与"思考过程"文字不在同一行的问题

## 摘要
ThinkingBlock 按钮中的 atom SVG 图标与"思考过程"文字未在同一行对齐，需要修复 flex 布局中的 SVG 对齐问题。

## 当前状态
- 文件：`src/render/ThinkingBlock.tsx`
- 按钮已设置 `display: 'flex', alignItems: 'center', gap: '6px'`
- 两个 SVG（atom 图标 + 箭头图标）均未设置 `flexShrink: 0`，在 flex 容器中可能被压缩或换行

## 变更内容

### `src/render/ThinkingBlock.tsx`

给两个 SVG 元素添加 `style={{ flexShrink: 0 }}`，防止 SVG 在 flex 布局中被压缩导致换行。

**第 22 行的 atom SVG：**
```tsx
<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
```

**第 28 行的箭头 SVG：**
```tsx
<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
```

## 验证
- 页面渲染时，atom 图标、"思考过程"文字、箭头图标三者在同一行水平居中对齐
