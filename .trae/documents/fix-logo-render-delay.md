# 修复 Logo 渲染延迟问题

## 问题
双 rAF 只等了约 32ms，但 logo 图片下载需要更长时间。进度在图片下载完成前就开始跑了。

## 修复方案

### 修改 `src/hooks/useStore.ts`

将双 rAF 替换为等待 logo 图片实际下载完成：

```ts
async function init() {
  // 等待 logo 图片下载完成，确保 loading 页面完整显示
  await new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = '/logo.png';
    // 如果图片已缓存，onload 会同步触发，需要检查 complete
    if (img.complete) resolve();
  });

  // 再等一帧确保 DOM 渲染
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });

  // 模拟进度...
}
```

关键点：
- `new Image()` + `onload` 等待图片实际下载完成
- `img.complete` 检查处理缓存情况（缓存时 onload 可能不触发）
- 额外一帧 rAF 确保 React `<img>` 有时间渲染已下载的图片
- 当前 useStore 无参数、依赖数组为 `[]`，不会有之前的闭包问题

### 不修改其他文件

## 验证
1. `npx tsc --noEmit` 无类型错误
2. 刷新页面，logo 应在进度开始前完整显示
