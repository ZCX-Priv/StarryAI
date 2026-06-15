# 修复代码块渲染 Bug 计划

## 问题描述
代码块渲染存在两个问题：
1. 每行代码之间存在间隙
2. 每行背景色与整个代码块的背景色不一致

## 根因分析

### 核心原因：highlight.js 主题 CSS 与自定义代码块样式冲突

`atom-one-dark.css`（来自 highlight.js）设置了以下关键样式：

```css
/* atom-one-dark.css */
pre code.hljs { display: block; overflow-x: auto; padding: 1em }
.hljs { color: #abb2bf; background: #282c34 }
```

而自定义代码块样式（`index.css`）设置的是：

```css
.code-block { background: #1a1b26; ... }
.code-block-content { padding: 14px; ... }
.markdown-body pre code { background: none; padding: 0; ... }
```

**问题 1：背景色不一致**
- `.code-block` 容器背景为 `#1a1b26`
- `.hljs`（在 `<code>` 元素上）背景为 `#282c34`
- 两个颜色不同，导致代码内容区域显示 `#282c34`，而容器边缘/间隙处显示 `#1a1b26`
- `.markdown-body pre code { background: none }` 的特异性 (0,1,2) 与 `pre code.hljs` 的特异性 (0,1,2) 相同，但 atom-one-dark.css 在打包后可能排在 index.css 之后，导致 `.hljs` 的背景覆盖了自定义的 `background: none`

**问题 2：行间间隙**
- `pre code.hljs { padding: 1em }` 给 `<code>` 元素添加了 1em 内边距
- `.code-block-content` 已有 `padding: 14px`，造成双重内边距
- 全局 `line-height: 1.6`（来自 `html, body`）被代码元素继承，对于代码块来说行高偏大
- `.hljs` 的 `background: #282c34` 与容器 `#1a1b26` 不同，在行间空白处形成视觉间隙

## 修复方案

### 修改文件：`src/index.css`

在 `/* Code Block */` 部分（第 189-199 行之后）添加针对 `.code-block-content` 内 `.hljs` 的覆盖样式：

```css
/* 覆盖 highlight.js atom-one-dark 主题的背景和内边距 */
.code-block-content .hljs {
  background: transparent;
  padding: 0;
}
.code-block-content pre code.hljs {
  padding: 0;
}
.code-block-content pre,
.code-block-content code {
  line-height: 1.6;
}
```

**暗色模式**：无需额外处理，因为 `.hljs` 背景已被设为透明，代码块容器背景 `#1a1b26` 统一显示。

**亮色模式**：已有 `[data-theme="light"] .hljs { background: #f6f8fa }` 覆盖，同样需要改为透明：

```css
[data-theme="light"] .code-block-content .hljs {
  background: transparent;
}
```

### 具体修改位置

在 `src/index.css` 第 199 行（`.code-block-no-lang` 规则之后）插入新的覆盖规则。

## 验证步骤

1. 启动开发服务器，在聊天中发送包含代码块的消息
2. 检查暗色模式下：代码块背景色统一为 `#1a1b26`，无行间间隙
3. 检查亮色模式下：代码块背景色统一为 `#f6f8fa`，无行间间隙
4. 检查无语言标识的代码块（`.code-block-no-lang`）是否正常
5. 运行 `npm run lint` 和 `npx tsc --noEmit` 确保无错误
