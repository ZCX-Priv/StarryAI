# 添加思考指示器（typing indicator）

## 问题

原版在 AI 开始回复前，会在聊天区域显示三个跳动的点（`.typing-indicator`）作为占位，等流式数据到达后替换为实际消息。React 版本缺少这个效果——流式期间聊天区域没有任何 AI 消息占位，只有输入区上方的 `StreamStatus` 小点。

## 现状

- CSS 已有：`index.css` 第 147-149 行有 `.typing-indicator` 和 `.td` 样式
- 原版流程：`UI.addTypingIndicator()` → 流式首个 chunk → `typingRow.remove()` + `UI.addBubble('assistant','')`
- React 版本流程：`handleSend` 中累积 `fullResp`，循环结束后才 `addMessage('assistant', fullResp)`，流式期间无任何 AI 占位

## 修复方案

在 `MessageList.jsx` 中，当 `isStreaming` 为 true 且没有正在流式的 assistant 消息时，显示 typing indicator。

### 修改文件

#### 1. `src/components/chat/MessageList.jsx`

在消息列表末尾，当 `isStreaming` 为 true 时渲染 typing indicator：

```jsx
{isStreaming && (
  <div className="msg-row ai">
    <div className="ai-msg-content">
      <div className="typing-indicator">
        <div className="td"></div>
        <div className="td"></div>
        <div className="td"></div>
      </div>
    </div>
  </div>
)}
```

这样当流式开始时（`isStreaming=true`），用户立即看到三个跳动的点；当 `addMessage('assistant', fullResp)` 被调用且 `isStreaming` 变为 false 后，typing indicator 消失，实际消息出现。

#### 2. `src/components/chat/InputArea.jsx`

当前流式逻辑在循环中累积文本，结束后才添加消息。为了让用户在流式过程中看到内容逐步出现（而非等全部完成），需要改为实时更新：

- 流式开始时先 `addMessage('assistant', '')` 添加空 AI 消息
- 每收到 chunk 时更新该消息内容（通过 store 的 `updateLastMessage` 或类似方法）
- 流式结束时移除 `streaming` 标记

**但这个改动较大**，且用户当前只要求恢复 typing indicator。所以先只做第 1 步：显示三个点的占位效果。流式实时渲染可以作为后续优化。

### 不改动的文件

- `index.css` — 已有样式
- `MessageBubble.jsx` — 不涉及
- `StreamStatus.jsx` — 保持不变

## 验证

1. 发送消息后，聊天区域立即出现三个跳动的点
2. AI 回复完成后，三个点消失，消息正常显示
