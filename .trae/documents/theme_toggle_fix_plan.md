
# 主题切换按钮修复方案

## 用户需求分析

用户要求：
1. **auto 模式下显示对应图标** - 根据实际应用的主题（系统偏好）显示太阳或月亮图标
2. **按钮只用于切换白昼/黑夜** - toggle 应该只在 `light` 和 `dark` 之间切换，不包含 `auto`

## 当前问题

当前 `toggle()` 函数在三种模式间循环：`auto` → `light` → `dark` → `auto`

## 修复方案

### 修改 useTheme.js

1. **修改 toggle() 函数**：
   - 只在 `light` 和 `dark` 之间切换
   - 如果当前是 `auto` 模式，根据当前实际主题决定切换方向

### 修改 Topbar.jsx（保持不变）

当前实现已经正确：
- 使用 store 中的 `theme` 状态计算 `isDark`
- 在 `auto` 模式下正确检测系统主题偏好

## 修改步骤

1. 修改 `useTheme.js` 中的 `toggle()` 函数
2. 验证构建

## 代码变更

```javascript
// 修改后的 toggle 函数
const toggle = useCallback(() => {
  const currentTheme = useAppStore.getState().theme;
  const currentActualTheme = document.documentElement.getAttribute('data-theme');
  
  if (currentTheme === 'auto') {
    apply(currentActualTheme === 'dark' ? 'light' : 'dark');
  } else {
    apply(currentTheme === 'dark' ? 'light' : 'dark');
  }
}, [apply]);
```

## 风险评估

- 低风险：只修改 toggle 逻辑
- 需要验证：图标显示是否正确，切换是否正常
