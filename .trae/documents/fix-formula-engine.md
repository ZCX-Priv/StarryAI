# 修复公式渲染引擎计划

## 问题摘要

应用中用美元符号包裹的 LaTeX 公式（行内 `$...$`、块级 `$$...$$`）完全未被渲染，直接以纯文本显示。此前多次尝试（Claude、DeepSeek）均未解决。

## 根本原因分析

1. **已安装的插件**：`remark-math`（解析公式语法）+ `rehype-mathjax/browser`。
2. **致命误解**：`rehype-mathjax/browser` 只是一个 **±1kb 的桥接插件**，它把 `$...$` 转换成 `\(...\)`、`$$...$$` 转换成 `\[...\]`，但**不做任何实际渲染**。它的设计意图是让浏览器中已加载的 MathJax 客户端库去扫描并渲染这些分隔符。
3. **致命缺陷**：项目中**没有任何地方加载 MathJax 的客户端 JavaScript 库**（既无 CDN `<script>`，也无 npm `mathjax` 包引入及初始化代码）。因此公式只会以原始 `\(...\)` 文本形式存在，根本不会被排版渲染。
4. **CSS 样式闲置**：`src/index.css` 中定义的 `mjx-container[jax="SVG"]` 样式是为 MathJax SVG 输出准备的，由于引擎未运行，这些元素根本不存在。

## 解决方案：使用 `rehype-mathjax` 默认入口（SVG 服务端渲染）

`rehype-mathjax` 包提供了三个入口：
- `rehype-mathjax/browser` — 桥接（±1kb），无渲染能力 ❌
- `rehype-mathjax/svg` — 在 rehype 管道中直接调用 `mathjax-full` 生成 SVG（±566kb）✅
- `rehype-mathjax/chtml` — 生成 CHTML（±154kb），但需要外部字体 URL ✅

`rehype-mathjax` 的默认导出就是 `./svg.js`。它使用 `mathjax-full` 内置的 `liteAdaptor`（纯 JavaScript 轻量级 DOM 实现），**不依赖浏览器 DOM，也不依赖 Node.js 的 `fs`**，可以在 Vite 浏览器环境中直接运行。它会将公式实时转换为内联 SVG 和对应的 `<style>`，因此**不需要额外的客户端 MathJax JS 库**。

这也是 npm 官方文档所描述的 "renders math with MathJax at compile time, which means that there is no client side JavaScript needed"。

## 具体改动

### 1. Markdown 渲染器修改（核心修复）

**文件**：`src/render/MarkdownRenderer.tsx`

**变更点**：
1. 将：
   ```ts
   import rehypeMathjax from 'rehype-mathjax/browser';
   ```
   改为：
   ```ts
   import rehypeMathjax from 'rehype-mathjax';
   // 或显式：import rehypeMathjax from 'rehype-mathjax/svg';
   ```
2. 保留现有的 `tex` 配置（`packages: { '[+]': ['mhchem'] }`），该配置对 SVG 入口同样有效。
3. `remarkPlugins` 中的 `remarkMath` **必须保留**，它负责解析 `$` 分隔符。

> 这是一个一行代码的改动，却是整个问题的根源。

### 2. 样式保留（无需修改）

**文件**：`src/index.css`

现有的 `mjx-container` 相关样式（221–224 行）是为 MathJax SVG 输出量身定制的：
```css
.markdown-body mjx-container { overflow-x: auto; overflow-y: hidden; }
.markdown-body mjx-container[jax="SVG"] { direction: ltr; }
.markdown-body mjx-container[display="true"] { display: block; text-align: center; margin: .75em 0; }
```
当切换到 `rehype-mathjax/svg` 后，这些 SVG 元素会正常出现，上述样式将直接生效。因此**无需删除，建议保留**。

### 3. 依赖无需调整（推荐保留）

`rehype-mathjax` 包已经安装在 `package.json` 中（当前版本 7.1.0），且它的 `svg.js` 入口依赖的 `mathjax-full` 也已通过 `rehype-mathjax` 的依赖自动安装。因此：
- **不需要**额外 `npm install mathjax`。
- **不需要**卸载 `rehype-mathjax`。
- **不需要**安装 `katex`。

如果用户后续确实需要客户端 MathJax 的某些高级功能（如动态公式编辑），可以再考虑引入 `mathjax` npm 包，但当前修复问题完全不需要。

## 验证步骤

1. **修改代码**：将 `rehype-mathjax/browser` 替换为 `rehype-mathjax`（默认 SVG）。
2. **类型检查**：`npx tsc --noEmit`
3. **代码检查**：`npm run lint`
4. **功能验证**：启动应用后，在聊天中查看包含以下内容的回复：
   - 行内公式：`$E=mc^2$`
   - 块级公式：`$$\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}$$`
   - 复杂公式（矩阵、多行对齐等）
   - 确认公式被正确渲染为 SVG 数学符号，而非纯文本。

## 决策记录

- **为何之前尝试失败**：之前的修复可能一直在 `rehype-mathjax/browser` 这个入口上打转，试图调整配置或样式，但没有意识到这个入口本身就不做渲染。Claude/DeepSeek 可能也没有识别出 `browser` 与默认 `svg` 入口的本质区别。
- **为何不改用 KaTeX**：用户反馈已尝试过 KaTeX，但复杂公式报错，因此保留 MathJax 方案。
- **为何不引入客户端 `mathjax` npm 包**：虽然用户允许安装，但 `rehype-mathjax/svg` 已经能在浏览器环境中完成全部渲染，无需引入额外的客户端库和手动 `typeset` 生命周期管理，方案更简洁。
- **为何 `rehype-mathjax/svg` 能在浏览器工作**：`mathjax-full` 提供了 `liteAdaptor`，它是一个纯 JS 的虚拟 DOM 实现，不依赖 Node.js `fs` 或真实浏览器 DOM，因此可以在 Vite 构建的浏览器应用中直接运行。
