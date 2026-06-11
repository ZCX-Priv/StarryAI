# 计划：移除消息复杂渲染，改为纯文本显示

## 概述

将项目中AI消息和用户消息的复杂渲染（Markdown、代码高亮、公式排版、流式渲染等）移除，改为纯文本显示。**保留思考块渲染**。

## 当前状态分析

项目使用原生 JavaScript，消息渲染管线为：

* 用户消息：`Renderer.escHtml()` → HTML 转义后插入 DOM

* AI 消息：`Renderer.parseMarkdown()` → Markdown→HTML 转换 → 插入 DOM

* 流式渲染：`Renderer.scheduleStream()` → stable/live 区域分离 → 增量渲染

* 依赖：highlight.js（代码高亮）、MathJax（公式）、4个渲染子模块

## 修改方案

### 1. 删除渲染子模块文件

以下3个文件将被完全删除，不再需要：

* `js/render/code.js` — 代码块渲染器（highlight.js 集成）

* `js/render/formula.js` — 公式渲染器（MathJax 集成）

* `js/render/markdown.js` — Markdown 解析器

**保留** `js/render/thinking-content.js` — 思考内容渲染器（用户要求保留）

### 2. 简化 `js/render/index.js`

将 Renderer 对象大幅简化：

* `escHtml(s)` — 保留，改为内联实现（不再委托 CodeRenderer）

* `parseMarkdown(text)` — 移除

* `scheduleStream(text, bubble)` — 简化：检测未闭合思考标签时调用 ThinkingRenderer 渲染，否则直接设置 textContent

* `renderStream(text, bubble)` — 简化：检测未闭合思考标签时调用 ThinkingRenderer 渲染，否则直接设置 textContent

* `finalizeRender(bubble, text)` — 简化：检测思考标签时用 ThinkingRenderer 渲染，否则直接设置 textContent

* 移除 `_renderOpenCodeBlock`、`_renderOpenFormula`、`_renderSingleLine`、`_renderMultiLine`、`_setHtmlIfChanged`、`_setParagraphText`、`_clearLive`、`_scheduleRender`、`_highlightCodeBlocks` 方法

* **保留** `_renderOpenThinkingBlock` 和 `_zones` 方法（思考块渲染需要 stable/live 区域分离）

* 移除 `copyCode`、`previewCode`、`toggleBlock`、`toggleBlockWrap`、`canPreviewCode`、`_setCodeToggleState` 方法

* 移除 `RenderModule.init()` 中对 `FormulaRenderer.init()` 的调用

### 3. 简化 `js/ui.js`

* `addBubble(role, content, rendered)` — AI 消息：检测是否含 `<think>` 标签，有则用 ThinkingRenderer 渲染思考块部分，其余文本用 textContent；用户消息：直接 textContent，移除折叠逻辑

* 移除 `toggleMsgCollapse()` 和 `collapseAllUserMsgs()` 方法

* 移除 `addBubble` 中对 `FormulaRenderer.typeset()` 的调用

* `addTypingIndicator()` — 保留（打字指示器仍需要）

* `updateStreamStatus(text)` — **保留**代码模式检测逻辑不变

### 4. 简化 `js/chat.js`

* `addMsg(role, content)` — `rendered` 字段：assistant 消息检测 `<think>` 标签，有则用 ThinkingRenderer 处理思考块部分，其余纯文本；user 消息直接存 content

* `_streamResponse()` — 简化流式渲染：

  * 保留 `Renderer.scheduleStream()` 调用（内部会处理思考块渲染）

  * 保留 `Renderer.finalizeRender()` 调用

  * 保留 `UI.updateStreamStatus()` 调用（含代码模式检测）

* `regenerate()` — 同上简化

* `send()` — 移除 `UI.collapseAllUserMsgs()` 调用

### 5. 简化 `js/api.js`

**保留** reasoning 提取和 `<think>` 标签注入逻辑（思考块渲染依赖此功能）：

* 保留 `_extractReasoning()` 方法

* 保留 `_mergeReasoningAndContent()` 方法

* 保留 `_normalizeReasoningValue()` 方法

* `fetch()` 和 `stream()` — 保持不变，继续注入 `<think>` 标签

### 6. 修改 `index.html`

* 移除 highlight.js CDN 链接（第21-22行）

* 移除 MathJax 配置和 CDN 链接（第25-41行）

* 移除3个渲染子模块的 script 标签：

  * `js/render/code.js`

  * `js/render/formula.js`

  * `js/render/markdown.js`

* **保留** `js/render/thinking-content.js` 的 script 标签

* 保留 `js/render/index.js` 的 script 标签

### 7. 清理 `css/chat.css`

移除以下不再需要的样式：

* 代码块相关：`.code-block-wrap`、`.code-block-header`、`.code-block-body`、`.code-block-lang`、`.code-block-actions`、`.code-copy-btn`、`.code-preview-btn`、`.code-block-toggle`

* 公式相关：`.formula-inline`、`.formula-display`

* 用户消息折叠：`.msg-collapse-btn`、`.msg-text-full`、`.msg-text-preview`

**保留**以下样式（思考块渲染需要）：

* 思考块相关：`.thinking-block`、`.thinking-summary`、`.thinking-thread`、`.thinking-step`

* 流式渲染区域：`.sb-stable`、`.sb-live`

### 8. 删除工具系统

删除以下工具相关文件：

* `js/tools/parser.js` — 工具标签解析器
* `js/tools/search.js` — 搜索工具
* `js/tools/image.js` — 图片生成工具
* `js/tools/music.js` — 音乐生成工具
* `js/tools/video.js` — 视频生成工具
* `js/mode/tools.js` — 工具执行调度

修改 `js/chat.js`：
* `_streamResponse()` — 移除 expert 模式下的工具标签解析和执行逻辑（第168-183行）

修改 `index.html`：
* 移除6个工具相关 script 标签（第403-411行）

## 不修改的部分

* 对话管理（创建/切换/删除/重命名）

* API 请求核心逻辑（保留 reasoning 处理，因为思考块依赖它）

* 上下文构建（system prompt、memory）

* 存储系统（IndexedDB）

* 模式切换（fast/thinking/expert）

* UI 框架（sidebar、topbar、modals、输入框）

* 主题系统

* 智能体系统

## 验证步骤

1. 启动服务器，打开应用
2. 发送用户消息，确认以纯文本显示
3. 收到 AI 回复，确认以纯文本显示（无 Markdown 渲染、无代码高亮、无公式排版）
4. 确认流式输出正常工作（文本逐步出现）
5. 确认对话管理功能正常（创建/切换/删除）
6. 确认重新生成功能正常
7. 确认复制回复功能正常
8. 检查浏览器控制台无报错

