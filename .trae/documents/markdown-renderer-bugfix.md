# Markdown 渲染器 Bug 修复计划

## 问题分析

### 问题 1：代码块不渲染
**根因**：`MarkdownRenderer.tsx` 静态导入了 `rehype-mathjax`，`CodeBlock.tsx` 静态导入了 `MermaidDiagram`（后者又静态导入 `mermaid`）。当这些模块因 Vite 缓存问题加载失败（504 错误）时，整个 `MarkdownRenderer` 组件崩溃，导致所有代码块都无法渲染。

### 问题 2：主提示词未更新
**现状**：`soul.md` 底部（第77-98行）已有基础的公式示例，但不完整——缺少 Mermaid 流程图文档，且格式说明不够全面。

### 问题 3：Vite 504 Outdated Optimize Dep
**根因**：新增了 `remark-math`、`rehype-mathjax`、`mermaid` 三个依赖，但 Vite 的依赖预构建缓存（`node_modules/.vite`）未更新，导致新模块无法加载。

## 修复步骤

### 步骤 1：清除 Vite 缓存
删除 `node_modules/.vite` 目录，重启开发服务器。

### 步骤 2：重构 CodeBlock.tsx — Mermaid 懒加载
将 `MermaidDiagram` 改为动态导入（`React.lazy` + `Suspense`），这样即使 mermaid 加载失败，普通代码块仍能正常渲染。

**修改文件**：`src/render/CodeBlock.tsx`
- 移除 `import MermaidDiagram from './MermaidDiagram'` 静态导入
- 使用 `React.lazy(() => import('./MermaidDiagram'))` 动态导入
- 用 `<Suspense fallback={...}>` 包裹 MermaidDiagram 渲染

### 步骤 3：更新 soul.md 提示词
**修改文件**：`src/prompts/soul.md`
- 在"输出格式说明"部分补充完整的渲染能力文档：
  - 代码块：指定语言即可触发语法高亮，支持所有主流语言
  - Mermaid 流程图：使用 ` ```mermaid ` 代码块，支持 graph/sequence/class/state/er/gantt/pie 等图表类型
  - 数学公式：行内 `$...$`、块级 `$$...$$`，支持 LaTeX 语法
  - 化学公式：使用 `\ce{}` 宏，支持有机化学、反应方程式、物理单位 `\pu{}`
  - HTML 预览：使用 ` ```html ` 代码块，用户可点击预览按钮查看渲染效果

### 步骤 4：补充 CSS 回退样式
**修改文件**：`src/index.css`
- 添加 `.markdown-body pre` 基础样式作为回退（当 CodeBlock 返回普通 `<pre>` 时）

## 文件变更清单

| 文件 | 操作 | 说明 |
|---|---|---|
| `node_modules/.vite` | 删除 | 清除 Vite 依赖预构建缓存 |
| `src/render/CodeBlock.tsx` | 修改 | Mermaid 懒加载，防止 mermaid 失败影响代码块 |
| `src/prompts/soul.md` | 修改 | 补充完整的 Markdown 渲染能力文档 |
| `src/index.css` | 修改 | 添加 `.markdown-body pre` 回退样式 |
