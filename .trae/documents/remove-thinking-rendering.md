# 移除思考块渲染，保留 think 标签解析

## 摘要

移除思考块（thinking block）的 UI 渲染和 CSS 样式，使 `<think>` 标签以纯文本形式显示。保留 API 层对推理内容的解析和 `<think>` 标签的注入逻辑。

## 当前状态分析

当前数据流：
```
API 响应 → api.js（提取 reasoning，注入 <think> 标签）→ render/index.js（检测 <think>，分发到 ThinkingRenderer）→ thinking-content.js（渲染为可折叠 UI）→ CSS 样式
```

- `api.js`：解析 API 返回的 `reasoning_content` 等字段，包裹为 `<think>...</think>` 标签 → **保留**
- `render/index.js`：检测 `<think>` 标签，调用 ThinkingRenderer → **需修改**
- `thinking-content.js`：将思考内容渲染为可折叠 HTML 块 → **删除**
- `chat.css` 第122-233行：`.thinking-*` 样式 → **删除**
- `index.html` 第378行：加载 `thinking-content.js` 的 script 标签 → **删除**

## 具体变更

### 1. 修改 `js/render/index.js`

**目标**：移除所有 ThinkingRenderer 引用，统一使用 `textContent` 显示文本（`<think>` 标签将以纯文本可见）。

- 删除 `_zones(bubble)` 方法（仅被 `_renderOpenThinkingBlock` 使用）
- 简化 `renderStream(text, bubble)`：移除 ThinkingRenderer 检测，直接 `bubble.textContent = text`
- 删除 `_renderOpenThinkingBlock(text, bubble)` 方法
- 简化 `finalizeRender(bubble, text)`：移除 ThinkingRenderer 分支，直接 `bubble.textContent = text`

修改后的完整文件：
```js
const Renderer = {
  _rafId: null,
  _rafPending: null,

  escHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  },

  scheduleStream(text, bubble) {
    this._rafPending = { text, bubble };
    if (!this._rafId) {
      this._rafId = requestAnimationFrame(() => {
        this._rafId = null;
        if (this._rafPending) {
          this.renderStream(this._rafPending.text, this._rafPending.bubble);
          this._rafPending = null;
          UI.maybeScroll();
        }
      });
    }
  },

  renderStream(text, bubble) {
    bubble.textContent = text;
  },

  finalizeRender(bubble, text) {
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    this._rafPending = null;
    bubble.textContent = text;
  }
};

const RenderModule = {
  init() {}
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    RenderModule.init();
  });
} else {
  RenderModule.init();
}
```

### 2. 删除 `js/render/thinking-content.js`

整个文件删除，不再需要 ThinkingRenderer。

### 3. 修改 `css/chat.css`

删除第122-233行的所有 `.thinking-*` 样式（从 `/* ── Thinking Block Styles ──` 注释开始到 `[data-theme="light"] .thinking-step code` 规则结束）。

### 4. 修改 `index.html`

删除第378行的 `<script src="js/render/thinking-content.js"></script>`。

## 不变更的文件

- `js/api.js`：保留 reasoning 解析和 `<think>` 标签注入逻辑
- `js/state.js`、`js/mode/thinking.js`、`js/mode/expert.js`：保留 API 请求参数
- `js/ui.js`：保留 `updateThinkingModeVisibility()` 方法
- `js/chat.js`：无需修改（调用 Renderer 的接口不变）

## 验证步骤

1. 启动服务器，打开页面
2. 使用 thinking 模式发送消息，确认：
   - API 仍返回推理内容，`<think>` 标签以纯文本形式显示在消息中
   - 没有可折叠的思考块 UI
   - 没有控制台报错（ThinkingRenderer 未定义等）
3. 使用 fast 模式发送消息，确认正常回复无变化
4. 检查历史消息加载正常
