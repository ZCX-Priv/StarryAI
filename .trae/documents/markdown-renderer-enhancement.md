# AIChat Markdown 渲染器增强计划

## 概述

为 AIChat 项目配置完整的 Markdown 渲染器，包括：代码块增强（语言标签 + 复制按钮 + HTML 预览按钮）、Mermaid 流程图渲染、MathJax 数理化生公式渲染（含 mhchem 有机化学宏包）。

## 现状分析

| 项目 | 当前状态 | 问题 |
|---|---|---|
| 代码高亮 | `rehype-highlight` 已安装 | 未引入 highlight.js 主题 CSS，无颜色显示 |
| 代码块样式 | 仅 `font-size` + `white-space` | 无背景色、边框、圆角、内边距 |
| 代码块功能 | 无 | 无语言标签、无复制按钮、无 HTML 预览 |
| 行内代码 | 无样式 | 无背景色/圆角区分 |
| 数学公式 | 未集成 | 无 remark-math / rehype-mathjax |
| Mermaid | 未集成 | 无 mermaid 包 |
| 表格/引用/链接 | 基础样式 | 无边框、无左侧线、无颜色 |
| 主题 | 暗色/亮色切换 | 代码块样式需适配双主题 |

**关键文件**：
- [MarkdownRenderer.tsx](file:///c:/Users/赵晨旭/Desktop/AIChat/src/render/MarkdownRenderer.tsx) — 核心渲染组件（21行，极简）
- [index.ts](file:///c:/Users/赵晨旭/Desktop/AIChat/src/render/index.ts) — 导出入口
- [index.css](file:///c:/Users/赵晨旭/Desktop/AIChat/src/index.css) — 全局样式（含 `.markdown-body` 基础样式，第166-190行）
- [themeStore.ts](file:///c:/Users/赵晨旭/Desktop/AIChat/src/status/themeStore.ts) — 主题状态管理

## 需要安装的依赖

```powershell
npm install remark-math rehype-mathjax mermaid
```

| 包名 | 版本 | 用途 |
|---|---|---|
| `remark-math` | ^6.0.0 | 解析 Markdown 中的 `$...$` / `$$...$$` 数学公式语法 |
| `rehype-mathjax` | ^7.1.0 | 将数学节点渲染为 MathJax SVG（构建时渲染，无需浏览器端加载 MathJax 运行时） |
| `mermaid` | ^11.15.0 | 流程图/图表渲染引擎 |

**注意**：`rehype-mathjax` 依赖 `mathjax-full`（包含 ams + mhchem 扩展），无需额外安装。

## 实施步骤

### 步骤 1：安装依赖

```powershell
npm install remark-math rehype-mathjax mermaid
```

### 步骤 2：创建 Mermaid 渲染组件

**新建文件**：`src/render/MermaidDiagram.tsx`

- 接收 `chart: string` 属性
- 使用 `mermaid.initialize({ startOnLoad: false, theme: 'dark' })` 初始化（模块顶层执行一次）
- 使用 `useEffect` + `mermaid.render(id, chart)` 异步渲染 SVG
- 使用 `crypto.randomUUID()` 生成唯一 ID（与项目现有 UUID 策略一致）
- 错误处理：渲染失败时显示红色错误提示
- 支持主题切换：监听 `useThemeStore` 的 theme 值，切换时调用 `mermaid.initialize({ theme })` 并重新渲染
- 渲染结果通过 `dangerouslySetInnerHTML` 插入

### 步骤 3：创建代码块增强组件

**新建文件**：`src/render/CodeBlock.tsx`

包含三个子组件：

#### 3.1 `CopyButton` — 复制按钮
- 接收 `text: string`
- 使用 `navigator.clipboard.writeText()` 复制
- 复制成功后图标从 `Copy` 切换为 `Check`（绿色），2秒后恢复
- 使用 lucide-react 的 `Copy` 和 `Check` 图标

#### 3.2 `HtmlPreviewButton` — HTML 预览按钮
- 接收 `htmlCode: string`
- 使用 lucide-react 的 `Eye` 图标
- 点击后使用 `srcdoc` iframe 渲染 HTML（沙箱隔离，安全）
- 预览区域在代码块下方展开，带关闭按钮
- 白色背景（HTML 通常为亮色设计）

#### 3.3 `CodeBlock` — 代码块容器
- 接收 react-markdown 的 `pre` 组件 props
- 从子元素 `<code>` 的 `className` 中提取语言标识（`/language-(\w+)/`）
- 结构：
  ```
  ┌─────────────────────────────────────┐
  │ python          [👁 预览] [📋 复制]  │  ← 头部栏（语言标签 + 按钮）
  ├─────────────────────────────────────┤
  │ print("hello world")               │  ← 代码内容（rehype-highlight 高亮）
  └─────────────────────────────────────┘
  ```
- 语言标签：左上角，小号等宽字体，灰色文字
- 复制按钮：右上角，`Copy`/`Check` 图标
- HTML 预览按钮：仅 `language === 'html' || language === 'htm'` 时显示，在复制按钮左侧
- Mermaid 代码块：拦截 `language-mermaid`，返回 `<MermaidDiagram>` 组件
- 无语言标识的 `<pre>`：直接透传（行内代码由 `code` 组件处理）

### 步骤 4：重写 MarkdownRenderer.tsx

**修改文件**：`src/render/MarkdownRenderer.tsx`

```tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeMathjax from 'rehype-mathjax';
import CodeBlock from './CodeBlock';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={['markdown-body', className].filter(Boolean).join(' ')}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[
          rehypeHighlight,
          [rehypeMathjax, {
            tex: {
              packages: { '[+]': ['ams', 'mhchem'] },
            },
            svg: {
              fontCache: 'local',
            },
          }],
        ]}
        components={{
          pre: CodeBlock,
          a: ({ href, children, ...props }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
```

**关键决策**：
- 使用 `pre` 组件自定义（而非 `code`），避免双重 `<pre>` 嵌套问题
- `rehypeHighlight` 在 `rehypeMathjax` 之前，确保代码块先高亮，数学节点后处理
- 链接添加 `target="_blank"` + `rel="noopener noreferrer"` 安全属性
- MathJax 配置 `packages: { '[+]': ['ams', 'mhchem'] }` 追加 AMS 数学 + 化学公式宏包

### 步骤 5：更新导出入口

**修改文件**：`src/render/index.ts`

新增导出 `MermaidDiagram`（供外部测试或独立使用）。

### 步骤 6：添加 highlight.js 主题 + 完整 Markdown 样式

**修改文件**：`src/index.css`

在 `.markdown-body` 区域后添加完整的 Markdown 渲染样式，包括：

#### 6.1 highlight.js 暗色主题（内联 CSS）
- 不引入外部 highlight.js CSS 文件，而是直接在 `index.css` 中编写精简版暗色主题
- 使用项目 CSS 变量（`--bg3`、`--text2` 等）保持一致性
- 暗色主题：深色背景 + 语法高亮颜色
- 亮色主题：`[data-theme="light"]` 覆盖为浅色背景 + 对应高亮颜色

#### 6.2 代码块容器样式
- `.code-block-wrapper`：圆角、溢出隐藏、边框
- `.code-block-header`：头部栏，深色背景，flex 布局
- `.code-block-lang`：语言标签样式
- `.code-block-actions`：按钮区域
- 按钮悬停效果

#### 6.3 行内代码样式
- 非 `<pre>` 内的 `<code>`：背景色、圆角、内边距、等宽字体

#### 6.4 表格样式
- 边框、斑马纹、表头背景

#### 6.5 引用块样式
- 左侧边框、背景色、内边距

#### 6.6 链接样式
- 颜色、下划线

#### 6.7 Mermaid 容器样式
- 居中、背景色、圆角、内边距

#### 6.8 MathJax 样式
- 块级公式居中
- 公式溢出时水平滚动

#### 6.9 HTML 预览区域样式
- iframe 白色背景、圆角、边框

### 步骤 7：验证

1. 启动开发服务器 `npm run dev`
2. 测试代码块渲染：语言标签显示、语法高亮颜色、复制按钮功能、HTML 预览按钮
3. 测试 Mermaid：发送包含 ` ```mermaid ` 代码块的消息
4. 测试数学公式：行内 `$E=mc^2$`、块级 `$$\int_0^\infty$$`、化学方程式 `$$\ce{C6H12O6}$$`
5. 测试暗色/亮色主题切换
6. 运行 `npm run lint` 和 `npx tsc --noEmit` 确保无错误

## 文件变更清单

| 文件 | 操作 | 说明 |
|---|---|---|
| `src/render/MermaidDiagram.tsx` | 新建 | Mermaid 渲染组件 |
| `src/render/CodeBlock.tsx` | 新建 | 代码块增强组件（语言标签 + 复制 + HTML 预览） |
| `src/render/MarkdownRenderer.tsx` | 重写 | 集成所有插件和自定义组件 |
| `src/render/index.ts` | 修改 | 新增 MermaidDiagram 导出 |
| `src/index.css` | 修改 | 添加完整的 Markdown 渲染样式 |

## 假设与决策

1. **MathJax SVG 模式**：选择构建时 SVG 渲染（`rehype-mathjax` 默认模式），无需浏览器端加载 MathJax 运行时，性能最优。缺点是无法使用 MathJax 交互功能（如可访问性菜单），但对聊天应用场景足够。

2. **highlight.js 主题内联**：不引入外部 highlight.js CSS 文件，而是在 `index.css` 中编写精简版主题，使用项目 CSS 变量保持与项目风格一致，同时支持暗色/亮色主题切换。

3. **HTML 预览使用 iframe srcdoc**：沙箱隔离，防止用户 HTML 影响 Chat 应用 DOM。不使用 `dangerouslySetInnerHTML` 直接渲染。

4. **Mermaid 主题同步**：监听 `useThemeStore` 的 theme 值，切换时重新初始化 Mermaid 并重新渲染图表。

5. **`singleDollarTextMath: true`（默认）**：支持 `$...$` 行内公式。如果聊天内容经常出现美元金额导致误解析，后续可调整为 `false`。

6. **代码块使用 `pre` 组件自定义**：避免 `code` 组件自定义导致的双重 `<pre>` 嵌套问题。
