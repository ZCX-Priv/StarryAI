# 修复用户消息在白昼模式下的样式适配

## Summary
当前用户消息气泡（`.msg-row.user .msg-bubble`）在白昼模式（`data-theme="light"`）下仍然使用深蓝色背景（`#2563eb`）+ 白色文字，与整体浅色主题不协调。同时，用户消息的"展开/收起"按钮（`.msg-collapse-btn`）在白昼模式下因文字颜色与气泡背景色冲突而几乎不可见。

本计划将：
1. 把白昼模式下的用户消息气泡改为浅色背景 + 深色文字
2. 修复展开按钮在白昼模式下的可见性

## Current State Analysis
- **文件**: `src/index.css`
- **暗色模式** (`:root`):
  - `--user-bubble: #2563eb`（蓝色气泡背景）
  - `--user-text: #ffffff`（白色文字）
  - `.msg-collapse-btn`: `background: rgba(255,255,255,.12); color: rgba(255,255,255,.8);`（在蓝色背景上可见）
- **白昼模式** (`[data-theme="light"]`):
  - `--user-bubble: #2563eb`（**未适配**，仍是蓝色）
  - `--user-text` **未定义**（继承 `#ffffff`，在蓝色背景上可见但不符合浅色主题）
  - `.msg-collapse-btn`: `background: rgba(37,99,235,.12); color: var(--accent);`
    - `var(--accent)` 在白昼模式下为 `#2563eb`
    - 与 `--user-bubble` 的 `#2563eb` 几乎相同，导致按钮看不见
- **气泡阴影**: `.msg-row.user .msg-bubble` 有 `box-shadow: 0 2px 14px rgba(37,99,235,.35)`，在白昼浅色背景下蓝色阴影突兀

## Proposed Changes

### 1. `src/index.css` — 调整白昼模式 CSS 变量
在 `[data-theme="light"]` 中：
- 将 `--user-bubble: #2563eb` 改为 `--user-bubble: #e0e7ff`（浅灰蓝色，与主题协调）
- 新增 `--user-text: #111118`（深色文字，与 `--text` 一致）

```css
[data-theme="light"] {
  /* ... 其他变量不变 ... */
  --user-bubble: #e0e7ff;
  --user-text: #111118;
  /* ... */
}
```

### 2. `src/index.css` — 覆盖用户消息气泡阴影（白昼模式）
在文件末尾的 `/* Light theme overrides */` 区域新增：

```css
[data-theme="light"] .msg-row.user .msg-bubble {
  box-shadow: 0 2px 14px rgba(0,0,0,.08);
}
```

### 3. `src/index.css` — 修复展开按钮在白昼模式下的可见性
修改已有的 `[data-theme="light"] .msg-collapse-btn` 规则：

```css
[data-theme="light"] .msg-collapse-btn {
  background: rgba(0,0,0,.08);
  color: var(--text2);
}
[data-theme="light"] .msg-collapse-btn:hover {
  background: rgba(0,0,0,.14);
  color: var(--text);
}
```

## Assumptions & Decisions
- 用户消息气泡在白昼模式下应遵循浅色主题，改为浅灰蓝背景（`#e0e7ff`）+ 深色文字，而非保持蓝色品牌色。
- 展开按钮不需要在白昼模式下使用品牌蓝色，使用中性深色（`var(--text2)`）即可保证在浅色背景上的可读性。
- 气泡阴影在白昼模式下同步调整为中性黑灰色阴影，避免蓝色阴影在浅色背景上显得突兀。
- `MessageBubble.tsx` 中用户消息文本 `<div ref={textRef}>` 未设置硬编码颜色，继承父元素 `color: var(--user-text)`，因此无需修改组件代码。

## Verification Steps
1. 启动应用并切换至白昼模式
2. 发送一条较长的用户消息，触发折叠状态（超过 3 行）
3. 验证用户消息气泡背景为浅灰蓝色（`#e0e7ff`），文字为深色（`#111118`）
4. 验证"查看全部"展开按钮在白昼模式下清晰可见
5. 切换回暗色模式，验证用户消息气泡仍保持蓝色背景 + 白色文字，展开按钮正常可见
