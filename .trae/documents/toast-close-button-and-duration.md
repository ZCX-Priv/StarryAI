# Toast 修改计划：关闭按钮移至右上角 + 停留时间改为 5s

## 现状分析

项目使用 **sonner v2.0.7** 作为 toast 库，在 [AppShell.tsx](file:///c:/Users/赵晨旭/Desktop/AIChat/src/components/layout/AppShell.tsx#L88) 中配置：

```tsx
<Toaster position="top-center" richColors closeButton theme={isDark ? 'dark' : 'light'} />
```

### 问题 1：关闭按钮在左上角

sonner v2 的 CSS（`node_modules/sonner/dist/styles.css`）中，LTR 模式下默认将关闭按钮放在左上角：

```css
html[dir='ltr'],
[data-sonner-toaster][dir='ltr'] {
  --toast-close-button-start: 0;      /* left: 0 */
  --toast-close-button-end: unset;     /* right: unset */
  --toast-close-button-transform: translate(-35%, -35%);
}

[data-sonner-toast][data-styled='true'] [data-close-button] {
  position: absolute;
  left: var(--toast-close-button-start);
  right: var(--toast-close-button-end);
  top: 0;
  transform: var(--toast-close-button-transform);
}
```

**关键坑点**：sonner 没有 `closeButtonPosition` 之类的 prop，关闭按钮位置完全由 CSS 自定义属性控制。Claude 之前可能尝试通过组件 prop 或简单的 CSS 选择器修改，但因为没有覆盖到正确的 CSS 自定义属性而失败。

### 问题 2：停留时间

当前未设置 `duration` 属性，使用 sonner 默认值 4000ms（4秒）。需要改为 5000ms（5秒）。

## 修改方案

### 修改 1：[AppShell.tsx](file:///c:/Users/赵晨旭/Desktop/AIChat/src/components/layout/AppShell.tsx#L88) — 添加 duration 属性

```tsx
// 修改前
<Toaster position="top-center" richColors closeButton theme={isDark ? 'dark' : 'light'} />

// 修改后
<Toaster position="top-center" richColors closeButton duration={5000} theme={isDark ? 'dark' : 'light'} />
```

### 修改 2：[index.css](file:///c:/Users/赵晨旭/Desktop/AIChat/src/index.css) — 覆盖 sonner 的 CSS 自定义属性，将关闭按钮移到右上角

在 `index.css` 末尾（响应式媒体查询之前）添加：

```css
/* Sonner toast: close button 移至右上角 */
[data-sonner-toaster][dir='ltr'],
html[dir='ltr'] {
  --toast-close-button-start: unset;
  --toast-close-button-end: 0;
  --toast-close-button-transform: translate(35%, -35%);
}
```

**原理**：
- 将 `--toast-close-button-start` 从 `0` 改为 `unset`（取消 left 定位）
- 将 `--toast-close-button-end` 从 `unset` 改为 `0`（设置 right: 0）
- 将 `--toast-close-button-transform` 从 `translate(-35%, -35%)` 改为 `translate(35%, -35%)`（水平偏移方向翻转）

这会覆盖 sonner 内置 CSS 中的默认值，因为项目 CSS 在 sonner CSS 之后加载，同选择器同优先级下后声明者生效。

## 验证步骤

1. 运行 `npm run dev` 启动开发服务器
2. 触发任意 toast（如切换主题、复制消息等）
3. 确认关闭按钮（X）出现在 toast 的**右上角**
4. 确认 toast 在 **5 秒后**自动消失
5. 确认暗色/亮色主题下都正常
