# Markdown 渲染器增强计划

## 摘要
为 AIChat 项目打造完整的 Markdown 渲染能力，包括代码块高亮（含语言标签、复制按钮、HTML 预览）、Mermaid 流程图渲染、MathJax 科学公式渲染（含宏包扩展）。所有依赖均通过 npm 引入，不使用 CDN。

## 现状分析
- **现有实现**：`MarkdownRenderer.tsx` 使用 `react-markdown` + `remark-gfm` + `rehype-highlight`
- **已安装但未使用**：`mermaid@11.15.0`、`remark-math@6.0.0`
- **缺失功能**：代码块语言标签、复制/预览按钮、Mermaid 渲染、公式渲染
- **样式基础**：`index.css` 中有 `.markdown-body` 基础样式，但无代码块专用样式
- **主题系统**：通过 `data-theme="light"` 属性切换暗色/亮色主题

## 技术方案

### 依赖安装
```bash
npm install react-syntax-highlighter better-react-mathjax mathjax
npm install -D @types/react-syntax-highlighter vite-plugin-static-copy
```

- `react-syntax-highlighter`：代码块语法高亮，支持运行时主题切换
- `better-react-mathjax`：React 封装的 MathJax v3，配置本地 MathJax 路径
- `mathjax`：提供 MathJax 浏览器构建文件，供 `vite-plugin-static-copy` 复制到输出目录
- `vite-plugin-static-copy`：将 `node_modules/mathjax/es5` 复制到构建产物的 `/mathjax` 目录

### 文件变更清单

#### 1. `vite.config.ts`
**变更内容**：引入 `vite-plugin-static-copy`，配置 MathJax 文件复制规则。
**原因**：`better-react-mathjax` 需要从本地路径加载 MathJax 脚本（非 CDN），通过此插件在开发和生产环境均提供 `/mathjax/*` 静态资源服务。

#### 2. `src/main.tsx`
**变更内容**：在应用根组件外包裹 `MathJaxContext`，配置 `src="/mathjax/tex-svg.js"` 及 tex 宏包。
**原因**：MathJax 需要在 React 树顶层初始化，配置宏包支持（amsmath、mhchem、physics、bbox 等）。

#### 3. `src/render/MarkdownRenderer.tsx`（重写）
**变更内容**：
- 引入 `remark-math`（已安装）解析 `$...$` / `$$...$$` 公式语法
- 自定义 `components`：
  - `code`：根据语言判断渲染 `CodeBlock` 或 `MermaidBlock`
  - `pre`：透传（由 `CodeBlock` 内部处理容器）
  - `math` / `inlineMath`：使用 `better-react-mathjax` 的 `<MathJax>` 组件渲染
- 移除 `rehype-highlight`（由 `react-syntax-highlighter` 替代）

#### 4. `src/render/CodeBlock.tsx`（新建）
**Props 接口**：
```typescript
interface CodeBlockProps {
  className?: string; // e.g. "language-javascript"
  children: string;
}
```
**实现逻辑**：
1. 解析语言标识（从 `className` 提取，默认 `text`）
2. 读取当前主题（`document.documentElement.getAttribute('data-theme')`）
3. 使用 `react-syntax-highlighter/Prism` 高亮代码：
   - 暗色主题：`vscDarkPlus`
   - 亮色主题：`oneLight`
4. 渲染代码块头部栏（flex 布局）：
   - 左侧：语言标签文本（如 "JAVASCRIPT"）
   - 右侧：按钮组
     - 复制按钮：`lucide-react` 的 `Copy` / `Check` 图标，点击后写入剪贴板，2 秒后恢复
     - HTML 预览按钮（仅当语言为 `html` 时显示）：`ExternalLink` / `Play` 图标，点击打开预览弹窗
5. 错误边界：高亮失败时回退到 `<pre>` 纯文本

#### 5. `src/render/MermaidBlock.tsx`（新建）
**Props 接口**：
```typescript
interface MermaidBlockProps {
  content: string;
}
```
**实现逻辑**：
1. 使用 `useRef` 获取容器 DOM
2. 在 `useEffect` 中调用 `mermaid.render(id, content)` 生成 SVG
3. 将 SVG 插入容器
4. 错误处理：try/catch 包裹，渲染失败时显示错误提示而非白屏
5. 每次内容变化时重新渲染

#### 6. `src/render/HtmlPreviewModal.tsx`（新建）
**Props 接口**：
```typescript
interface HtmlPreviewModalProps {
  html: string;
  visible: boolean;
  onClose: () => void;
}
```
**实现逻辑**：
1. 复用项目现有弹窗样式（`.modal-overlay`、`.modal` 等）
2. 使用 `<iframe srcDoc={html}>` 安全渲染用户 HTML 代码
3. iframe 样式：`width: 100%`、`height: 500px`、`border-radius: 12px`、`border: 1px solid var(--border2)`

#### 7. `src/render/index.ts`
**变更内容**：导出新增的 `CodeBlock`、`MermaidBlock`、`HtmlPreviewModal`（可选，供外部使用）。

#### 8. `src/index.css`
**变更内容**：
- 添加 `.markdown-body pre` 相关样式重置（移除默认边距）
- 添加代码块头部栏样式（背景、圆角、按钮 hover 效果）
- 添加 Mermaid 图表容器样式（居中、阴影、滚动）
- 添加 MathJax 公式样式（块级居中、行内对齐、颜色继承主题）
- 确保亮色主题下代码块头部文字和按钮颜色正确

### 架构交互图
```
MessageBubble.tsx
    │
    ▼
MarkdownRenderer.tsx (react-markdown)
    │
    ├─ remarkPlugins: [remarkGfm, remarkMath]
    │
    ├─ components.code ──→ CodeBlock.tsx (非 mermaid)
    │   │                      │
    │   │                      ├─ react-syntax-highlighter/Prism
    │   │                      ├─ Copy 按钮 → navigator.clipboard
    │   │                      └─ HTML Preview 按钮 → HtmlPreviewModal
    │   │
    │   └─ MermaidBlock.tsx (语言为 mermaid)
    │       │
    │       └─ mermaid.render() → SVG
    │
    ├─ components.math ──→ <MathJax> (better-react-mathjax)
    │
    └─ components.inlineMath ──→ <MathJax inline>

main.tsx
    │
    └─ MathJaxContext (src="/mathjax/tex-svg.js")
           │
           └─ 配置 tex.packages: [amsmath, mhchem, physics, bbox]
```

## 假设与决策

1. **MathJax 加载方式**：使用 `better-react-mathjax` + `vite-plugin-static-copy` 将 `mathjax/es5/tex-svg.js` 作为本地静态资源提供。`tex-svg.js` 输出 SVG，不依赖外部字体文件，最利于自托管。
2. **代码高亮主题**：暗色使用 `vscDarkPlus`，亮色使用 `oneLight`，通过运行时检测 `data-theme` 属性切换。
3. **Mermaid 渲染位置**：在 `react-markdown` 的 `code` 组件中检测 `language-mermaid`，由 `MermaidBlock` 接管渲染。这符合 Markdown 中 ```mermaid 代码块的写法。
4. **公式语法**：支持 `$...$`（行内）和 `$$...$$`（块级），通过 `remark-math` 解析。MathJax 同时支持 `\(...\)` 和 `\[...\]` 作为备选。
5. **HTML 预览安全**：使用 `srcDoc` 属性的 iframe 渲染，与主页面脚本隔离。
6. **类型安全**：所有新增组件定义 Props 接口，不使用 `any`。`react-syntax-highlighter` 的主题对象类型通过 `@types/react-syntax-highlighter` 提供。

## 验证步骤

1. 安装依赖后运行 `npm run lint` 和 `npx tsc --noEmit`，确保无错误。
2. 启动开发服务器，测试以下 Markdown 内容：
   - 代码块（各种语言）：验证高亮、语言标签、复制按钮
   - ` ```html ` 代码块：验证预览按钮和弹窗
   - ` ```mermaid ` 代码块：验证流程图渲染
   - `$E=mc^2$` 和 `$$\int_a^b f(x)dx$$`：验证公式渲染
   - 有机化学式（如 `$\ce{CO2 + C -> 2CO}$`）：验证 mhchem 宏包
3. 切换亮色/暗色主题，验证代码高亮主题同步切换。
4. 运行 `npm run build`，确认产物中包含 `dist/mathjax/` 目录且无构建错误。
