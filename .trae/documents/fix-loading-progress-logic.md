# 修复 Loading 页面进度逻辑计划

## 问题
`useStore` 的初始化在 `useEffect` 中立即开始，进度从 0% 跑到 17%+ 时，logo 图片可能还没加载完，用户看到进度在跑但 logo 不可见。

## 修改方案

### 修改 `src/App.tsx`
在 App 组件中，等待 logo 图片加载完成后再让 `useStore` 开始初始化：

1. 新增 `logoLoaded` state，初始值 `false`
2. 给 `<img>` 添加 `onLoad` 回调，设置 `logoLoaded = true`
3. 将 `logoLoaded` 传入 `useStore`，只有当 `logoLoaded` 为 true 时才启动初始化流程

### 修改 `src/hooks/useStore.ts`
- 新增参数 `logoReady: boolean`
- 在 `useEffect` 依赖数组中加入 `logoReady`
- 在 `init()` 前加守卫：`if (!logoReady) return;`
- 这样 logo 未加载完时不会启动任何初始化，进度保持 0%

## 验证
1. `npx tsc --noEmit` 无类型错误
2. 刷新页面，确认 logo 先显示出来，然后进度才开始从 0% 递增
