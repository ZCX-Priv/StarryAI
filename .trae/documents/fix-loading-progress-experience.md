# 修复 Loading 进度体验问题

## 修复方案

### 修改 `src/hooks/useStore.ts`

**逻辑**：
1. 启动模拟进度定时器，先快后慢递增到 99% 停住
2. 同时执行真实初始化
3. 真实初始化完成后，清除定时器，进度飞速递增到 100%（每 30ms +10），然后 setInitialized(true)

```ts
async function init() {
  // 模拟进度：先快后慢，到 99% 停住
  let simulated = 0;
  const progressTimer = setInterval(() => {
    if (simulated < 60) simulated += 8;
    else if (simulated < 85) simulated += 5;
    else if (simulated < 99) simulated += 2;
    else return; // 到 99% 停住
    if (!cancelled) setLoadProgress(simulated);
  }, 300);

  try {
    // 真实初始化（无 setLoadProgress 调用）
    await IDBStore.init();
    await Migration.run();
    // ... 所有原有初始化逻辑 ...

    // 初始化完成！飞速递增到 100%
    clearInterval(progressTimer);
    await new Promise<void>((resolve) => {
      const finishTimer = setInterval(() => {
        simulated += 10;
        if (simulated >= 100) {
          simulated = 100;
          clearInterval(finishTimer);
          if (!cancelled) setLoadProgress(100);
          resolve();
        } else {
          if (!cancelled) setLoadProgress(simulated);
        }
      }, 30);
    });
    if (!cancelled) setInitialized(true);
  } catch (err) {
    clearInterval(progressTimer);
    if (!cancelled) setError((err as Error).message);
  }
}
```

效果：
- 初始化快 → 进度从当前位置飞速冲到 100%（约 300ms 内）
- 初始化慢 → 进度慢慢爬到 99% 卡住，等初始化完成后飞速冲到 100%

### 不修改 `src/App.tsx` 和 `src/index.css`
