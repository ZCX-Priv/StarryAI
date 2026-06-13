# 修复加载页 Logo 与跳动圆点间距过小

## 问题
加载页面中，`.loading-logo`（80px 高）与 `.loading-indicator`（三个跳动圆点）之间的间距仅为 `gap: 20px`。圆点的 `tdBounce` 动画向上移动 7px，视觉上跳动时圆点会触及 logo 底部。

## 涉及文件
- `src/index.css` — `.loading-page` 的 `gap` 值

## 修改方案
将 `.loading-page` 的 `gap` 从 `20px` 增大到 `32px`，为圆点弹跳留出足够空间。

```css
/* 修改前 */
.loading-page { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; gap: 20px; }

/* 修改后 */
.loading-page { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; gap: 32px; }
```

## 验证
- 启动 `npm run dev`，观察加载页面的 logo 与跳动圆点之间是否有足够间距，圆点弹跳时不再触及 logo 底部。
