# 修复主题切换：第一次无反应 + 图标不更新

## 问题根因

1. **第一次点击无反应**：初始化时 `if (theme)` 检查，当 IDB 没有保存 theme（首次使用默认 'auto'）时，`data-theme` DOM 属性从未被设置。toggle 读取 `data-theme` 为 null，行为异常。

2. **图标不变**：`isDark` 由 `computeIsDark(theme)` 计算，在 auto 模式下 toggle 不改变 store 的 `theme` 值（仍为 'auto'），所以 `isDark` 始终跟随系统偏好，不反映手动切换后的实际状态。

## 修复方案

### 1. `src/hooks/useStore.js` — 始终初始化 `data-theme`

把 `if (theme)` 改为无条件执行，确保默认 'auto' 也能正确设置 `data-theme`：

```js
// 之前
if (theme) {
  store.setTheme(theme);
  const dark = ...;
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
}

// 之后
{
  const t = theme || 'auto';
  const dark = t === 'dark' || (t === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
}
```

### 2. `src/hooks/useTheme.js` — isDark 跟踪实际 `data-theme`

核心改动：`isDark` 不再从 `computeIsDark(theme)` 计算，而是直接跟踪 `data-theme` 的实际值。每次修改 `data-theme` 时同步更新 `isDark`。

```js
export default function useTheme() {
  const theme = useAppStore(s => s.theme);
  const [isDark, setIsDark] = useState(() => {
    const dt = document.documentElement.getAttribute('data-theme');
    return dt ? dt === 'dark' : computeIsDark(useAppStore.getState().theme);
  });

  const apply = useCallback((newTheme) => {
    useAppStore.getState().setTheme(newTheme);
    const dark = computeIsDark(newTheme);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    setIsDark(dark);
    IDBStore.setConfig('theme', newTheme);
    requestAnimationFrame(() => useAppStore.getState().triggerHoneycombRedraw());
  }, []);

  const toggle = useCallback(() => {
    const currentTheme = useAppStore.getState().theme;
    if (currentTheme === 'auto') {
      const dark = document.documentElement.getAttribute('data-theme') === 'dark';
      document.documentElement.setAttribute('data-theme', dark ? 'light' : 'dark');
      setIsDark(!dark);
      requestAnimationFrame(() => useAppStore.getState().triggerHoneycombRedraw());
    } else {
      apply(currentTheme === 'dark' ? 'light' : 'dark');
    }
  }, [apply]);

  // auto 模式下系统偏好变化时同步
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (useAppStore.getState().theme === 'auto') apply('auto');
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [apply]);

  return { theme, isDark, apply, toggle };
}
```

关键变化：
- `setIsDark(dark)` 在 `apply()` 中调用
- `setIsDark(!dark)` 在 toggle 的 auto 分支中调用
- 移除复杂的 store subscribe + prevThemeRef 逻辑，因为 `apply` 已经通过 `setTheme` 触发 store 更新，Zustand selector `s => s.theme` 会自动触发重渲染
- `isDark` 不再依赖 `computeIsDark(theme)` 而是直接跟踪实际显示状态

## 修改文件

| 文件 | 改动 |
|------|------|
| `src/hooks/useStore.js` | 初始化时无条件设置 `data-theme` |
| `src/hooks/useTheme.js` | isDark 跟踪实际 data-theme，toggle/apply 中同步更新 |

## 验证

1. 首次使用（无 IDB 数据），点击主题按钮立即切换颜色和图标
2. auto 模式下多次切换，颜色和图标同步变化
3. 刷新页面后主题和图标正确
