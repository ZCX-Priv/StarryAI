# 修复公式渲染引擎计划（客户端 MathJax 方案）

## 问题摘要

应用中的 LaTeX 公式（`$...$`、`$$...$$`）无法渲染。此前尝试 `rehype-mathjax/browser` 因缺少 MathJax 客户端库而失败；尝试 `rehype-mathjax/svg`（默认入口）则在 Vite 浏览器环境中直接崩溃：

```
Uncaught ReferenceError: require is not defined
    at eval (... rehype-mathjax.js ...)
```

崩溃原因是 `mathjax-full` 内部包含 `require()` 动态加载，在浏览器 ESM 环境下完全不兼容。

## 根本原因分析

1. **`rehype-mathjax/browser`**：仅 ±1kb 的桥接插件，只转换分隔符，不做实际渲染。项目中又未引入 MathJax 客户端库，因此公式永远只是 `\(...\)` 纯文本。
2. **`rehype-mathjax/svg`（默认入口）**：虽然能直接生成 SVG，但它依赖 `mathjax-full` 的 Node.js 源码。`mathjax-full` 在浏览器中会执行 `new Function("return require(...)")`，触发 `require is not defined` 致命错误。
3. **KaTeX 被排除**：用户已验证 KaTeX 对复杂公式支持不足。

## 解决方案：官方 `mathjax@3` 客户端渲染 + 自定义 React 组件隔离

### 为什么选择这个方案

- **官方发布包稳定**：`mathjax@3` 的 `es5/` 目录包含预构建的浏览器组件（ES5，无 `require`），可直接通过 `<script>` 加载。
- **完全客户端**：不依赖任何 "服务端/编译时" 渲染插件，彻底避开 `mathjax-full` 的 Node.js 依赖陷阱。
- **React 友好**：每个公式封装为独立 React 组件 `MathJaxNode`。React 只管理外层容器，MathJax 仅修改组件内部的 DOM，两者互不侵犯。流式输出时已有公式不会被重建。
- **复杂公式支持**：使用 `tex-svg-full.js`（约 2.2MB），包含所有 TeX 扩展（含 `mhchem`），无需动态加载其他文件。

### 架构设计

```
用户输入: $E=mc^2$ 和 $$\int...$$
    ↓
remark-math 解析为 mdast math 节点
    ↓
remark-rehype 转为 hast:
  - inline: <code class="language-math math-inline">E=mc^2</code>
  - block:  <pre><code class="language-math math-display">\int...</code></pre>
    ↓
ReactMarkdown components 拦截:
  - pre 组件发现 lang==='math' → 渲染 <MathJaxNode display value={...} />
  - code 组件发现 math-inline → 渲染 <MathJaxNode value={...} />
    ↓
MathJaxNode 组件:
  1. 等待 window.MathJax 加载完成
  2. 给公式包裹 \(...\) 或 \[...\] 分隔符
  3. 调用 MathJax.typesetPromise([el]) 仅渲染当前元素
  4. 卸载时调用 typesetClear 清理
```

**注意**：完全抛弃 `rehype-mathjax` 插件（browser 和 svg 均不用）。`remark-math` 单独工作即可生成可被 React 拦截的 `<code>` 元素。

## 具体改动

### 1. 引入 MathJax 客户端库

**安装**：`npm install mathjax@3`（已在终端执行完成）

**静态资源部署**：
`mathjax@3` 的浏览器组件位于 `node_modules/mathjax/es5/`（约 23MB）。必须把该目录完整复制到 `public/mathjax/`，Vite 会自动将其映射到 `http://localhost:5173/mathjax/...`，并在生产构建时复制到 `dist/mathjax/`。

**`package.json` scripts 修改**：
```json
{
  "scripts": {
    "copy-mathjax": "xcopy /E /I /Y node_modules\\mathjax\\es5 public\\mathjax",
    "dev": "npm run copy-mathjax && vite",
    "build": "npm run copy-mathjax && vite build"
  }
}
```

**`index.html` 修改**：
在 `<head>` 中添加 MathJax 配置和脚本：
```html
<script>
  window.MathJax = {
    tex: {
      inlineMath: [['\\(', '\\)']],
      displayMath: [['\\[', '\\]']]
    },
    startup: {
      typeset: false
    }
  };
</script>
<script src="/mathjax/tex-svg-full.js" id="MathJax-script" async></script>
```

使用 `tex-svg-full.js` 的原因：
- **full**：包含所有 TeX 扩展（ams、mhchem、physics 等），无需运行时动态加载。
- **svg**：SVG 输出把所有图形路径内联，不需要外部字体文件（不像 CHTML 需要 woff 字体）。
- `async` 加载不会阻塞页面渲染。

### 2. 新建公式渲染组件

**文件**：`src/components/ui/MathJaxNode.tsx`

实现要点：
- 接收 `value: string`（公式纯文本，不含 `$`）和 `display?: boolean`。
- 使用 `useRef` 获取 DOM 元素（`<span>` 或 `<div>`）。
- `useEffect` 中：
  1. 轮询等待 `window.MathJax?.startup?.promise` 存在。
  2. `await window.MathJax.startup.promise`。
  3. 设置 `el.textContent = display ? '\\[' + value + '\\]' : '\\(' + value + '\\)'`。
  4. `await window.MathJax.typesetPromise([el])`。
- 卸载时 `return () => { window.MathJax?.typesetClear?.([el]); }`。
- block 公式用 `<div style={{ textAlign: 'center', margin: '.75em 0' }}>` 包裹；inline 用 `<span>`。

### 3. 修改 Markdown 渲染器

**文件**：`src/render/MarkdownRenderer.tsx`

**变更点**：
1. **移除** `rehypeMathjax` 的 import 和 `rehypePlugins` 中的配置。只保留：
   ```ts
   rehypePlugins={[rehypeHighlight]}
   ```
2. **`pre` 组件**：在 `if (lang === 'mermaid')` 之后、`if (lang)` 之前添加：
   ```ts
   if (lang === 'math') {
     return <MathJaxNode display value={codeText} />;
   }
   ```
3. **`code` 组件**：添加 math-inline 拦截：
   ```ts
   if (className?.includes('math-inline')) {
     const text = extractTextFromChildren(children);
     return <MathJaxNode value={text} />;
   }
   ```
4. 导入 `MathJaxNode`。

### 4. 样式保留

**文件**：`src/index.css`

保留现有的 `mjx-container` 样式（221–224 行）：
```css
.markdown-body mjx-container { overflow-x: auto; overflow-y: hidden; }
.markdown-body mjx-container[jax="SVG"] { direction: ltr; }
.markdown-body mjx-container[display="true"] { display: block; text-align: center; margin: .75em 0; }
```
MathJax 客户端 SVG 输出同样生成 `mjx-container[jax="SVG"]` 元素，这些 CSS 会直接生效。

## 验证步骤

1. **执行复制**：`npm run copy-mathjax`
2. **修改代码**：完成上述 `MarkdownRenderer.tsx`、`MathJaxNode.tsx`、`index.html`、`package.json` 修改。
3. **类型检查**：`npx tsc --noEmit`
4. **代码检查**：`npm run lint`（仅关注 `src/` 目录，忽略预先存在的 `参考/` 错误）。
5. **启动验证**：`npm run dev`
6. **功能测试**：在聊天中查看或构造包含以下内容的回复：
   - 行内公式：`$E=mc^2$`
   - 块级公式：`$$\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}$$`
   - 复杂公式（矩阵、多行对齐、mhchem 化学式如 `$\ce{H2O}$`）
   - 确认公式正确渲染为 SVG，无纯文本残留，无 `require` 报错。

## 决策记录

- **为何不用 `rehype-mathjax` 任何入口**：`browser` 不渲染，`svg` 在浏览器报 `require is not defined`。两者都已证明不可行。
- **为何不用 KaTeX**：用户已验证复杂公式报错，明确排除。
- **为何用 `tex-svg-full.js`**：确保所有扩展（含 `mhchem`）内置，避免运行时动态加载失败。SVG 输出无需外部字体，部署最简单。
- **为何每个公式独立组件**：防止 MathJax 修改 DOM 后与 React 虚拟 DOM diff 冲突。流式输出时已有公式不会被 React 重建。
- **为何不加 `postinstall` 而是修改 `dev`/`build` 脚本**：避免每次 `npm install` 都强制复制，减少不必要的 IO。
