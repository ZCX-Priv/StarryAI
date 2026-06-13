# 替换 Atom SVG 图标

## 摘要
将 `ThinkingBlock.tsx` 中的旧版 atom SVG 图标（circle + ellipse）替换为 Lucide 风格的 atom SVG 图标（circle + path）。

## 当前状态
- 文件：`src/render/ThinkingBlock.tsx`，第 22-27 行
- 旧图标使用 `<circle>` + `<ellipse>` + `rotate` 变换绘制原子轨道

## 变更内容

### `src/render/ThinkingBlock.tsx`（第 22-27 行）

**替换前：**
```tsx
<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <circle cx="12" cy="12" r="1" /><circle cx="12" cy="12" r="5" />
  <ellipse cx="12" cy="12" rx="10" ry="4" />
  <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
  <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
</svg>
```

**替换后：**
```tsx
<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <circle cx="12" cy="12" r="1" />
  <path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z" />
  <path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z" />
</svg>
```

## 验证
- `npx tsc --noEmit` 无类型错误
- 页面渲染正常，atom 图标显示为 Lucide 风格
