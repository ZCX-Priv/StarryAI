# Markdown 渲染器增强计划

## 概述

为 AIChat 项目的 MarkdownRenderer 添加完整的代码块渲染（语言标签 + 复制按钮 + HTML预览按钮）、Mermaid 流程图渲染、以及 MathJax 数学/化学公式渲染。

## 现状分析

### 已有基础设施
- `react-markdown` v10 + `remark-gfm` + `rehype-highlight` 已集成，但渲染非常基础
- `remark-math` v6 + `rehype-mathjax` v7 **已安装但未接入**插件链
- `mermaid` v11 **已安装但未集成**
- `HtmlPreviewDialog` 组件**已存在**（`src/components/modals/HtmlPreviewDialog.tsx`），使用 iframe sandbox 渲染 HTML
- 项目有完善的暗色/亮色主题切换机制（`:root` 暗色，`[data-theme="light"]` 亮色）

### 当前缺陷
1. **代码块**：无语言标签、无复制按钮、无预览按钮；未导入 highlight.js CSS 主题（高亮样式缺失）
2. **数学公式**：`remark-math` + `rehype-mathjax` 未接入，不支持 `$...$` / `$$...$$`
3. **Mermaid**：已安装但无渲染组件，mermaid 代码块显示为纯文本
4. **自定义渲染**：`MarkdownRenderer` 未使用 `react-markdown` 的 `components` 属性

## 实施方案

### 步骤 1：安装 highlight.js 为直接依赖

```bash
npm install highlight.js
```

> 虽然 highlight.js 作为 rehype-highlight 的间接依赖已存在，但我们需要显式导入其 CSS 主题文件，安装为直接依赖更可靠。

### 步骤 2：创建 `src/render/CodeBlock.tsx` — 代码块组件

**功能**：
- 顶部标题栏：左侧显示编程语言名称，右侧显示操作按钮
- 复制按钮（所有代码块）：使用 `lucide-react` 的 `Copy` / `Check` 图标，点击后复制代码内容并显示"已复制"反馈
- 预览按钮（仅 HTML 代码块）：使用 `lucide-react` 的 `Eye` 图标，点击后打开 `HtmlPreviewDialog`
- 代码内容区：保留 rehype-highlight 生成的高亮 HTML

**Props 接口**：
```typescript
interface CodeBlockProps {
  language: string;        // 编程语言标识（如 'python', 'html'）
  code: string;            // 原始代码文本（用于复制和预览）
  children: React.ReactNode; // rehype-highlight 生成的高亮 HTML 内容
}
```

**语言名称映射**：创建小型映射表，将常见语言代码转为友好显示名（如 `js` → `JavaScript`，`py` → `Python`），未匹配的直接首字母大写。

**复制逻辑**：使用 `navigator.clipboard.writeText()`，复制后图标切换为 `Check` 持续 2 秒。

**预览逻辑**：组件内部维护 `showPreview` 状态，点击预览按钮时设置 HTML 代码并打开 `HtmlPreviewDialog`。

### 步骤 3：创建 `src/render/MermaidBlock.tsx` — Mermaid 图表组件

**功能**：
- 接收 mermaid 代码文本
- 使用 `mermaid.render()` 异步渲染为 SVG
- 渲染成功：显示 SVG 图表，带有圆角边框和适当内边距
- 渲染失败：降级显示原始代码文本，附带错误提示
- 流式场景：代码可能不完整，渲染失败时显示"图表渲染中..."提示

**实现要点**：
- 使用 `useEffect` + `useRef` 管理渲染生命周期
- 每次渲染使用唯一 ID（`mermaid-${Date.now()}-${Math.random()}`）
- 使用 `dangerouslySetInnerHTML` 插入 SVG
- 捕获 mermaid.render 异常，优雅降级

### 步骤 4：修改 `src/render/MarkdownRenderer.tsx` — 核心集成

**变更内容**：

1. **新增插件**：
   - `remarkPlugins` 添加 `remarkMath`
   - `rehypePlugins` 添加 `rehypeMathjax`（配置 mhchem 扩展以支持化学公式）

2. **添加 `components` 属性覆写**：
   - 覆写 `pre` 组件：提取子 `code` 元素的 `className`（含语言信息）和文本内容，根据语言分发到 `CodeBlock` 或 `MermaidBlock`
   - 覆写 `code` 组件：仅处理行内代码（无 className 的情况），块级代码由 `pre` 覆写处理

3. **MathJax 配置**（通过 rehype-mathjax 选项）：
   ```typescript
   rehypeMathjax({
     tex: {
       packages: { '[+]': ['mhchem'] },  // 启用化学公式宏包
       inlineMath: [['$', '$']],
       displayMath: [['$$', '$$']],
     }
   })
   ```

**渲染管线更新**：
```
原始 Markdown
  → remark-gfm (GFM 扩展)
  → remark-math (数学公式解析)
  → rehype-highlight (代码高亮)
  → rehype-mathjax (MathJax SVG 输出 + mhchem)
  → 自定义 components (CodeBlock / MermaidBlock / 行内code)
  → React 组件树
```

### 步骤 5：修改 `src/index.css` — 样式增强

**新增样式**：

1. **highlight.js 主题**：
   - 导入 `highlight.js/styles/atom-one-dark.css`（暗色主题）
   - 在 `[data-theme="light"]` 下覆盖关键 hljs 颜色变量（背景、前景、关键字、字符串、注释等约 15 个选择器）

2. **代码块容器样式**（`.code-block`）：
   - 圆角边框、深色背景（暗色模式）/ 浅灰色背景（亮色模式）
   - 标题栏（`.code-block-header`）：flex 布局，左右对齐，半透明背景
   - 语言标签（`.code-block-lang`）：小号字体，低对比度颜色
   - 操作按钮（`.code-block-btn`）：hover 效果，与项目 icon-btn 风格一致
   - 代码内容区：适当内边距，水平滚动

3. **Mermaid 容器样式**（`.mermaid-block`）：
   - 居中显示，圆角边框
   - 适当内边距
   - SVG 自适应宽度

4. **MathJax 输出样式**：
   - 行内公式（`mjx-container`）垂直居中对齐
   - 块级公式居中显示，上下间距

5. **亮色主题适配**：
   - 所有新增样式在 `[data-theme="light"]` 下有对应覆盖

### 步骤 6：修改 `src/render/index.ts` — 导出更新

无需变更（CodeBlock 和 MermaidBlock 为 MarkdownRenderer 内部使用，无需单独导出）。

## 文件变更清单

| 文件 | 操作 | 说明 |
|---|---|---|
| `package.json` | 修改 | 新增 `highlight.js` 直接依赖 |
| `src/render/CodeBlock.tsx` | 新建 | 代码块组件（语言标签 + 复制 + 预览） |
| `src/render/MermaidBlock.tsx` | 新建 | Mermaid 图表渲染组件 |
| `src/render/MarkdownRenderer.tsx` | 修改 | 集成 remark-math、rehype-mathjax、自定义 components |
| `src/index.css` | 修改 | 添加代码块样式、hljs 主题、mermaid 样式、mathjax 样式 |

## 假设与决策

1. **代码块背景色**：暗色模式下始终使用深色背景（即使亮色主题也保持深色代码块，类似 GitHub），亮色模式下使用浅灰色背景 — 这是最常见的做法，视觉区分度好
2. **Mermaid 渲染时机**：仅在代码完整时尝试渲染，流式传输中渲染失败则显示"图表渲染中..."
3. **MathJax 输出格式**：使用 SVG 输出（rehype-mathjax 默认），无需额外字体加载
4. **化学公式支持**：通过 MathJax 的 mhchem 扩展实现，支持 `\ce{}` 命令书写化学方程式和有机化学结构
5. **语言名称映射**：仅映射最常见的 20 种语言，其余直接首字母大写显示

## 验证步骤

1. **代码块渲染**：发送包含多种语言代码块的 Markdown，验证语言标签显示、语法高亮、复制按钮功能
2. **HTML 预览**：发送包含 HTML 代码块的消息，验证预览按钮出现且点击后 iframe 正确渲染
3. **Mermaid 渲染**：发送包含 mermaid 代码块的消息，验证流程图正确渲染为 SVG
4. **数学公式**：发送包含行内公式 `$E=mc^2$` 和块级公式 `$$\int_0^1 x^2 dx$$` 的消息，验证正确渲染
5. **化学公式**：发送包含 `\ce{C6H12O6}` 和 `\ce{2H2 + O2 -> 2H2O}` 的消息，验证 mhchem 正确渲染
6. **主题切换**：在暗色/亮色主题间切换，验证所有渲染组件样式正确适配
7. **流式渲染**：在 AI 流式输出过程中验证代码块、公式、图表的渐进渲染表现
8. **运行 `npm run lint` 和 `npx tsc --noEmit`** 确保无类型错误和 lint 问题
