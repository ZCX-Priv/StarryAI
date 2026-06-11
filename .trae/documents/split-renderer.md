# 拆分渲染器到 render 文件夹

## 概述

将散落在各处的消息内容渲染逻辑拆分到 `src/render/` 文件夹，与原版项目 `js/render/` 的组织方式对齐。

## 现状分析

当前渲染相关代码分散在三处：

| 位置 | 内容 | 问题 |
|------|------|------|
| `lib/renderer.js` | `MarkdownRenderer` 组件（remarkGfm + rehypeHighlight） | 已封装但**未被使用** |
| `components/chat/MessageBubble.jsx` | 内联 `ReactMarkdown`（仅 remarkGfm，**缺少代码高亮**）+ `extractThinkingBlocks()` + `ThinkingBlock` | 渲染逻辑与 UI 组件耦合 |
| `components/chat/MessageList.jsx` | 引用 `MessageBubble` | 无问题，保持不动 |

**额外问题**：`MessageBubble.jsx` 直接用了 `ReactMarkdown` 但没加 `rehypeHighlight`，导致代码块没有语法高亮。而 `lib/renderer.js` 已经有完整版本却没被引用。

## 目标结构

```
src/render/
├── index.js              # 统一导出
├── MarkdownRenderer.jsx  # Markdown 渲染组件（从 lib/renderer.js 迁移）
├── ThinkingBlock.jsx     # 思考过程折叠块（从 MessageBubble.jsx 提取）
└── extractThinking.js    # 思考块提取工具函数（从 MessageBubble.jsx 提取）
```

## 具体变更

### 1. 新建 `src/render/MarkdownRenderer.jsx`
- 从 `lib/renderer.js` 迁移，内容基本不变
- 保留 `remarkGfm` + `rehypeHighlight` 插件配置

### 2. 新建 `src/render/ThinkingBlock.jsx`
- 从 `MessageBubble.jsx` 第 26-65 行提取 `ThinkingBlock` 组件
- 原样迁移，无逻辑变更

### 3. 新建 `src/render/extractThinking.js`
- 从 `MessageBubble.jsx` 第 5-24 行提取 `extractThinkingBlocks` 函数
- 纯工具函数，无依赖

### 4. 新建 `src/render/index.js`
- 统一导出：`MarkdownRenderer`、`ThinkingBlock`、`extractThinkingBlocks`

### 5. 修改 `src/components/chat/MessageBubble.jsx`
- 删除内联的 `extractThinkingBlocks`、`ThinkingBlock`、`ReactMarkdown`/`remarkGfm` 导入
- 改为从 `@/render` 导入 `MarkdownRenderer`、`ThinkingBlock`、`extractThinkingBlocks`
- 使用 `<MarkdownRenderer content={mainContent} />` 替换内联 `<ReactMarkdown>`
- **附带修复**：代码块将获得语法高亮（因为用了 `rehypeHighlight`）

### 6. 删除 `src/lib/renderer.js`
- 内容已迁移到 `src/render/MarkdownRenderer.jsx`，原文件删除

## 不动的文件

- `MessageList.jsx` — 消息列表容器，非渲染器
- `MessageActions.jsx` — 操作按钮，非渲染器
- `StreamStatus.jsx` — 状态指示器，非渲染器
- `EmptyState.jsx` — 空状态展示，非渲染器
- `HtmlPreviewDialog.jsx` — HTML 预览弹窗，非渲染器

## 验证步骤

1. `npm run build` 无报错
2. `npm run dev` 页面正常渲染
3. AI 回复中代码块有语法高亮
4. 思考过程折叠块正常展开/收起
5. 用户消息正常显示
