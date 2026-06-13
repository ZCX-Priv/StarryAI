# 修复 Loading 页面 Logo 渲染被阻塞问题

## 问题
Logo 图片渲染被堵住，进度跑一半才显示出来。原因是 `useEffect` 中的 `init()` 立即开始执行 IDB 初始化等操作，这些操作在主线程上执行时会阻塞浏览器的渲染和图片解码。

## 修复方案

### 修改 `src/hooks/useStore.ts`

在 `init()` 函数最开头，用双 `requestAnimationFrame` 让出主线程，确保浏览器先完成 loading 页面的渲染（包括 logo 图片显示），再开始初始化工作：

```ts
async function init() {
  // 等待浏览器完成当前帧渲染，确保 loading 页面（含 logo）先显示出来
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

  // 模拟进度...
  let simulated = 0;
  // ... 后续逻辑不变
}
```

双 rAF 的原理：
- 第一个 rAF：等待浏览器准备绘制
- 第二个 rAF：确保绘制已经完成，图片已渲染

### 不修改其他文件

## 验证
1. `npx tsc --noEmit` 无类型错误
2. 刷新页面，logo 应该在进度开始跑之前就显示出来
