# 修复 Loading 页面卡死问题

## 问题根因
`useStore` 接收 `logoReady` 参数，但 `useEffect` 依赖数组是 `[]`（空），导致闭包中 `logoReady` 永远是初始值 `false`，`if (!logoReady) return` 永远为 true → 初始化永远不执行 → 卡死。

如果改依赖数组为 `[logoReady]`，又会触发 React 的 "dependency array changed size" 警告（因为 HMR/StrictMode 下渲染间数组大小不一致），且 logoReady 变化时 effect 重跑会产生竞态。

## 修复方案

### 1. 修改 `src/hooks/useStore.ts`
- 移除 `logoReady` 参数，恢复为无参数
- `useEffect` 依赖数组恢复为 `[]`
- 在 `init()` 函数最开头，用 `new Image()` 预加载 logo，await 其 onload：
```ts
await new Promise<void>((resolve) => {
  const img = new Image();
  img.onload = () => resolve();
  img.onerror = () => resolve(); // 即使加载失败也不阻塞
  img.src = '/logo.png';
});
```
这样在 logo 加载完成前不会推进进度，且不依赖 React 的重渲染机制。

### 2. 修改 `src/App.tsx`
- 移除 `logoLoaded` state 和 `useState` 导入
- 移除 `onLoad` 回调
- `useStore()` 恢复为无参数调用

## 验证
1. `npx tsc --noEmit` 无类型错误
2. 刷新页面，logo 先显示，然后进度开始递增，不再卡死
