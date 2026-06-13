# Loading 页面实现计划

## 概述
将 App.tsx 中简陋的"加载中..."文本替换为一个美观的 Loading 页面，居中显示星语 logo 和三点弹跳动画。

## 当前状态分析
- **App.tsx** 第 16-22 行：未初始化时仅显示纯文本"加载中..."，无任何视觉效果
- **三点动画已存在**：`index.css` 第 176-179 行定义了 `.typing-indicator` / `.td` / `@keyframes tdBounce`，与 MessageList.tsx 中 AI 响应等待占位符完全一致
- **Logo 文件**：`public/logo.png`，可通过 `/logo.png` 路径引用

## 修改方案

### 1. 修改 `src/App.tsx`
将当前的加载状态 UI：
```tsx
if (!initialized) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-secondary)' }}>
      加载中...
    </div>
  );
}
```
替换为：
```tsx
if (!initialized) {
  return (
    <div className="loading-page">
      <img src="/logo.png" alt="星语" className="loading-logo" />
      <div className="typing-indicator">
        <div className="td"></div>
        <div className="td"></div>
        <div className="td"></div>
      </div>
    </div>
  );
}
```

### 2. 修改 `src/index.css`
在全局样式中新增 Loading 页面样式（复用已有的 `.typing-indicator` 和 `.td` 动画）：
```css
.loading-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 24px;
}

.loading-logo {
  width: 80px;
  height: 80px;
  object-fit: contain;
  animation: loadingPulse 2s ease-in-out infinite;
}

@keyframes loadingPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
```

## 设计决策
- **复用现有动画**：`.typing-indicator` + `.td` + `tdBounce` 已在 index.css 中定义，无需重复编写
- **Logo 添加呼吸效果**：`loadingPulse` 动画让 logo 有轻微的透明度变化，增加视觉层次感
- **不创建新组件文件**：Loading 页面代码量极少，直接写在 App.tsx 中即可，避免文件膨胀
- **Logo 尺寸 80px**：与 EmptyState 组件中的 logo 尺寸保持一致

## 验证步骤
1. 运行 `npx tsc --noEmit` 确认无类型错误
2. 运行 `npm run dev` 启动开发服务器
3. 刷新页面，观察 Loading 页面是否正确显示 logo + 三点动画
4. 确认初始化完成后正常过渡到主界面
