# Toast 夜间模式适配计划

## 问题
`<Toaster>` 组件未设置 `theme` 属性，导致 toast 不跟随应用的暗色/亮色主题切换。

## 当前状态
- 应用主题通过 `data-theme` 属性控制（`"dark"` / `"light"`）
- `useTheme()` hook 提供 `isDark` 状态
- `AppShell.jsx` 中的 `<Toaster position="top-center" richColors closeButton />` 没有传 `theme` 属性

## 修改方案

### 修改 `src/components/layout/AppShell.jsx`
1. 导入 `useTheme` hook
2. 在组件中调用 `useTheme()` 获取 `isDark`
3. 给 `<Toaster>` 添加 `theme={isDark ? 'dark' : 'light'}`

具体改动：
```jsx
// 新增导入
import useTheme from '@/hooks/useTheme';

// 组件内新增
const { isDark } = useTheme();

// Toaster 添加 theme 属性
<Toaster position="top-center" richColors closeButton theme={isDark ? 'dark' : 'light'} />
```

## 验证
- 切换到亮色主题，toast 应为亮色背景
- 切换到暗色主题，toast 应为暗色背景
- `npm run build` 无报错
