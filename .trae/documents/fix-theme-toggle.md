# 修复主题切换缺陷

## 问题

React 版主题切换存在 3 个缺陷：

1. **初始化时 `data-theme` 未设置**（严重）：`useStore.js` 加载 theme 后只调用 `setTheme()` 更新 store，未设置 DOM 的 `data-theme` 属性，导致页面始终暗色
2. **蜂巢画布不随主题重绘**：切换主题后 HoneycombCanvas 不重绘
3. **Topbar 图标不响应系统主题变化**：`isDark` 计算依赖 `window.matchMedia` 但非响应式

## 修复方案

### 1. 修复初始化 — `src/hooks/useStore.js`

加载 theme 后，同步设置 `data-theme` DOM 属性：

```js
if (theme) {
  store.setTheme(theme);
  const dark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
}
```

### 2. 修复蜂巢重绘 — `src/hooks/useTheme.js`

在 `apply()` 中添加蜂巢重绘逻辑。通过 store 中的 `honeycombNeedsRedraw` 标记通知 HoneycombCanvas 重绘：

- store 中添加 `honeycombNeedsRedraw: false` 和 `triggerHoneycombRedraw` action
- `apply()` 末尾调用 `triggerHoneycombRedraw()`
- `HoneycombCanvas` 监听该标记，触发重绘后重置

### 3. 修复 isDark 响应式 — `src/hooks/useTheme.js`

在 `useTheme` hook 中维护一个 `isDark` 状态，系统偏好变化时也更新它：

```js
const [isDark, setIsDark] = useState(() => {
  const t = useAppStore.getState().theme;
  return t === 'dark' || (t === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
});

useEffect(() => {
  const update = () => {
    const t = useAppStore.getState().theme;
    setIsDark(t === 'dark' || (t === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches));
  };
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', update);
  const unsub = useAppStore.subscribe((s) => { if (s.theme !== prevTheme) update(); });
  return () => { mediaQuery.removeEventListener('change', update); unsub(); };
}, []);
```

### 4. 修复 toggle 保持 auto — `src/hooks/useTheme.js`

原版 toggle 只翻转实际显示的 dark/light，不改变 store 中的 `'auto'` 状态。React 版应保持一致：

```js
toggle() {
  const currentTheme = useAppStore.getState().theme;
  if (currentTheme === 'auto') {
    // auto 模式下，只翻转 data-theme，不改变 store 的 theme 值
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.documentElement.setAttribute('data-theme', dark ? 'light' : 'dark');
  } else {
    apply(currentTheme === 'dark' ? 'light' : 'dark');
  }
}
```

## 修改文件清单

| 文件 | 改动 |
|------|------|
| `src/hooks/useStore.js` | 初始化 theme 后设置 `data-theme` DOM 属性 |
| `src/hooks/useTheme.js` | 添加 isDark 响应式状态、修复 toggle 保持 auto、触发蜂巢重绘 |
| `src/store/useAppStore.js` | 添加 `honeycombNeedsRedraw` 状态和 action |
| `src/components/layout/Topbar.jsx` | 使用 `useTheme()` 返回的 `isDark` 而非自行计算 |
| `src/components/layout/HoneycombCanvas.jsx` | 监听 `honeycombNeedsRedraw` 触发重绘 |

## 验证

1. 刷新页面，亮色主题正确应用
2. 点击主题切换按钮，dark/light 正常切换
3. auto 模式下点击切换，store 保持 auto 不变
4. 切换系统主题偏好，auto 模式下页面和图标跟随变化
5. 切换主题后蜂巢画布重绘
