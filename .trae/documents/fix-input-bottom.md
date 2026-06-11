# 修复输入区域不在底部的问题

## 问题根因

原版 HTML 结构中，`#input-area` 是 `#chat-area` 的**兄弟元素**，都在 `#main` 内部：
```html
<main id="main">
  <div id="topbar">...</div>
  <div id="chat-area">...</div>       ← flex:1, overflow-y:auto
  <div id="input-area">...</div>      ← flex-shrink:0, 固定在底部
</main>
```

React 版本中，`InputArea` 被放在了 `#chat-area` **内部**：
```jsx
<div id="chat-area" ref={chatAreaRef}>
  <MessageList />
  <InputArea />     ← 错误：在 #chat-area 内部，会随内容滚动
</div>
```

因为 `#chat-area` 有 `overflow-y: auto`，`#input-area` 作为其子元素会随聊天内容一起滚动，无法固定在底部。

## 修复方案

将 `InputArea` 从 `ChatArea` 中移出，改为在 `AppShell` 中作为 `#main` 的直接子元素，与原版 HTML 结构一致。

### 修改文件

1. **`src/components/chat/ChatArea.jsx`**
   - 移除 `InputArea` 的导入和渲染
   - `scroll-btn` 也需要移到 `#input-area` 内部（与原版一致）

2. **`src/components/chat/InputArea.jsx`**
   - 将 `scroll-btn` 和 `StreamStatus` 移入 `#input-area` 内部（与原版一致）

3. **`src/components/layout/AppShell.jsx`**
   - 在 `#main` 内部，`ChatArea` 之后渲染 `InputArea`

## 验证
- 输入区域固定在页面底部，不随聊天内容滚动
- 滚动按钮正常显示在输入区域上方
