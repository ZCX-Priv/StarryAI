
# 主题初始化缺陷修复方案

## 问题分析

**根本原因**：原版代码在初始化时调用 `Theme.apply(theme)`，这会同时：
1. 设置 `state.theme = theme`
2. 根据 theme 设置 `document.documentElement.setAttribute('data-theme', ...)`
3. 更新图标显示

但 NodeJS 版本的 `useStore.js` 只调用了 `store.setTheme(theme)`，**没有调用 `apply()` 来设置 DOM 上的 `data-theme` 属性！**

**导致的问题**：
- 第一次点击主题切换按钮时，`toggle()` 读取的 `document.documentElement.getAttribute('data-theme')` 可能不存在或为 `null`
- 第一次点击后才正确设置了 `data-theme`
- 第二次点击才正常工作

## 修复方案

修改 `useStore.js`，在初始化时调用 `apply()` 而不是 `setTheme()`：

```javascript
// 修改前
if (theme) store.setTheme(theme);

// 修改后
if (theme) {
  store.setTheme(theme);
  // 同时设置 DOM 上的 data-theme 属性
  const dark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
}
```

或者，在组件首次渲染时调用 `apply()` 来初始化主题。

## 修复步骤

1. 修改 `src/hooks/useStore.js`，在加载 theme 配置后，同时设置 DOM 上的 `data-theme` 属性

## 风险评估

- 低风险：只添加初始化逻辑，不影响其他功能
- 需要验证：初始化后图标显示是否正确，第一次点击是否正常
