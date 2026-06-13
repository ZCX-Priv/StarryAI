# 优化 Loading 进度显示平滑度

## 问题
模拟进度以整数步进（+8、+5、+2），冲刺阶段 +10，导致进度只显示 8%、16%、24% 这样的整数跳跃，看起来很死板。

## 修复方案

### 修改 `src/hooks/useStore.ts`

将模拟进度改为小数步进，显示时取整，实现平滑递增效果：

**模拟阶段**（先快后慢，总时长 8s，100ms 间隔 = 80 ticks）：
- 0-60%：3.5s = 35 ticks → 每 tick +1.71
- 60-85%：2.5s = 25 ticks → 每 tick +1
- 85-99%：1.5s = 15 ticks → 每 tick +0.93
- 剩余 0.5s = 5 ticks 停在 99%

**冲刺阶段**（初始化完成后飞速到 100%）：
- 每 20ms +3

显示时用 `Math.round()` 取整，这样进度看起来是 1%、3%、5%、8%... 平滑递增，而不是 8%、16%、24% 的死板跳跃。

```ts
// 模拟进度：先快后慢，到 99% 停住
let simulated = 0;
const progressTimer = setInterval(() => {
  if (simulated < 60) simulated += 1.71;
  else if (simulated < 85) simulated += 1;
  else if (simulated < 99) simulated += 0.93;
  else return;
  if (!cancelled) setLoadProgress(Math.round(simulated));
}, 100);

// ... 初始化完成后冲刺 ...
clearInterval(progressTimer);
await new Promise<void>((resolve) => {
  const finishTimer = setInterval(() => {
    simulated += 3;
    if (simulated >= 100) {
      simulated = 100;
      clearInterval(finishTimer);
      if (!cancelled) setLoadProgress(100);
      resolve();
    } else {
      if (!cancelled) setLoadProgress(Math.round(simulated));
    }
  }, 20);
});
```

### 不修改其他文件

## 验证
1. `npx tsc --noEmit` 无类型错误
2. 刷新页面，进度平滑递增（1%、3%、5%...），不再死板跳跃
