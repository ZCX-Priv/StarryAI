# Loading 页面优化计划

## 问题
1. 三个点太小（当前 7px，复用了聊天消息内的尺寸）
2. 缺少"加载中"文字提示

## 修改方案

### 1. 修改 `src/App.tsx`
在三点动画下方添加"加载中"文字：
```tsx
<div className="loading-page">
  <img src="/logo.png" alt="星语" className="loading-logo" />
  <div className="loading-indicator">
    <div className="loading-dot"></div>
    <div className="loading-dot"></div>
    <div className="loading-dot"></div>
  </div>
  <span className="loading-text">加载中</span>
</div>
```

改用独立的 `.loading-dot` 类名而非复用 `.td`，避免影响聊天消息中的三点样式。

### 2. 修改 `src/index.css`
将 `.loading-page` 部分替换为：
```css
/* Loading Page */
.loading-page { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; gap: 20px; }
.loading-logo { width: 80px; height: 80px; object-fit: contain; animation: loadingPulse 2s ease-in-out infinite; }
@keyframes loadingPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }
.loading-indicator { display: flex; align-items: center; gap: 8px; }
.loading-dot { width: 10px; height: 10px; background: var(--text3); border-radius: 50%; animation: tdBounce 1.4s ease-in-out infinite; }
.loading-dot:nth-child(2) { animation-delay: .18s; }
.loading-dot:nth-child(3) { animation-delay: .36s; }
.loading-text { font-size: 14px; color: var(--text3); }
```

关键变化：
- 点的尺寸从 7px → 10px，间距从 4px → 8px
- 新增"加载中"文字（14px，使用 `var(--text3)` 颜色）
- 使用独立类名 `.loading-dot`，不污染聊天消息的 `.td` 样式
- 复用已有的 `tdBounce` 关键帧动画

## 验证
1. `npx tsc --noEmit` 无类型错误
2. 刷新页面确认 loading 页面效果：更大的三点 + "加载中"文字
