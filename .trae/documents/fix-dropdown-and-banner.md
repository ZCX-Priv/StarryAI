# 修复下拉菜单位置 + 添加 Banner 功能按钮

## 问题 1：下拉菜单位置错误

原版 `UI.positionDropdown()` 手动计算菜单位置（优先在按钮上方显示）：
```js
positionDropdown(menu, triggerBtn) {
  const rect = triggerBtn.getBoundingClientRect();
  const menuRect = menu.getBoundingClientRect();
  let top = rect.top - menuRect.height - 8;
  let left = rect.left;
  if (top < 8) top = rect.bottom + 8;
  menu.style.top = top + 'px';
  menu.style.left = left + 'px';
}
```

React 版本的 `ModeSelector` 只切换 `show` class，没有设置 `top/left`，导致 `position: fixed` 的菜单出现在默认位置。

### 修复：`src/components/chat/ModeSelector.jsx`
- 添加 `positionMenu` 逻辑：打开时计算按钮位置，设置菜单的 `top/left`
- 使用 `useEffect` + `useLayoutEffect` 在打开时定位

## 问题 2：Banner 功能按钮缺失

原版 `Banner.renderActions()` 在 `.input-actions` 中插入 6 个功能按钮（图像生成、解题答疑、翻译、编程、深入研究、数据分析），放在 `spacer` 之前。逻辑：
- 如果 actions <= 3，全部显示为按钮
- 如果 actions > 3，前 2 个显示为按钮，其余放入"更多"下拉菜单

React 版本的 `InputArea` 完全没有渲染 banner 按钮。

### 修复：`src/components/chat/InputArea.jsx`
- 在 `ModeSelector` 和 `spacer` 之间渲染 Banner 按钮
- 从 `useBanner` hook 获取 bannerConfig 和 handleAction
- 实现"更多"下拉菜单（当 actions > 3 时）
- 选中状态：点击 banner 按钮后高亮，再次点击取消
- 隐藏其他按钮：选中某个 banner 后隐藏其余 banner 按钮

## 修改文件

1. **`src/components/chat/ModeSelector.jsx`** — 添加菜单定位逻辑
2. **`src/components/chat/InputArea.jsx`** — 添加 Banner 功能按钮渲染
3. **`src/hooks/useBanner.js`** — 确认 hook 可用，可能需要调整

## 验证
- 点击"快速"按钮，下拉菜单出现在按钮上方
- 输入区域显示 banner 功能按钮（图像生成、解题答疑等）
- 点击 banner 按钮切换模式，placeholder 变化
- "更多"下拉菜单正常工作
