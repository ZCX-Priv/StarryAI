# 修复 MathJax chemfig 加载错误计划

## 问题摘要

公式渲染时，如果公式中包含 `\chemfig{...}` 命令，MathJax 会尝试动态加载 `input/tex/extensions/chemfig.js`，但该文件在 MathJax 3 的标准扩展中**不存在**，导致：

```
Error: Can't load "http://localhost:4000/mathjax/input/tex/extensions/chemfig.js"
net::ERR_ABORTED
```

由于 `MathJaxNode` 组件未捕获 `typesetPromise` 的异常，整个公式渲染失败，页面只显示空白或错误状态。

## 根本原因分析

1. **`tex-svg-full.js` 包含 `autoload` 扩展**：该扩展配置了某些命令（如 `\chemfig`）在首次使用时自动加载对应扩展包。
2. **`chemfig` 不是 MathJax 3 内置扩展**：`node_modules/mathjax/es5/input/tex/extensions/` 目录下没有 `chemfig.js` 文件。
3. **`MathJaxNode` 缺乏错误降级**：`await mj.typesetPromise([el])` 没有任何 `try/catch`，加载失败直接抛异常，后续恢复逻辑也无法执行。

## 解决方案（双保险）

### 保险一：在 MathJax 配置中禁用 chemfig 的自动加载

**文件**：`index.html`

在 `window.MathJax` 配置中，通过 `tex.autoload` 覆盖默认映射，将 `chemfig` 的自动加载指向空数组，从源头阻止 MathJax 发起无效的 HTTP 请求：

```html
<script>
  window.MathJax = {
    tex: {
      inlineMath: [['\\(', '\\)']],
      displayMath: [['\\[', '\\]']],
      autoload: {
        chemfig: []
      }
    },
    startup: {
      typeset: false
    }
  };
</script>
```

> 注：`autoload` 配置中，键是 TeX 命令名，值是扩展数组。空数组表示该命令不触发任何扩展加载，MathJax 会把它当作普通未定义命令处理。

### 保险二：MathJaxNode 组件增加错误降级

**文件**：`src/components/ui/MathJaxNode.tsx`

用 `try/catch` 包裹 `typesetPromise`：
- 渲染成功：MathJax 正常显示 SVG 公式。
- 渲染失败（包括任何扩展加载失败、语法错误等）：在元素中回退显示原始公式文本（保留 `\(...\)` 或 `\[...\]` 分隔符或纯文本），避免页面出现空白或崩溃。

```ts
try {
  await mj.typesetPromise([el]);
} catch {
  // 降级：显示原始公式文本
  el.textContent = display ? `$$${value}$$` : `$${value}$`;
}
```

## 具体改动

### 1. `index.html` — 禁用 chemfig 自动加载

**变更**：在 `window.MathJax.tex` 配置中增加 `autoload: { chemfig: [] }`。

### 2. `src/components/ui/MathJaxNode.tsx` — 增加错误降级

**变更**：
1. 将 `await mj.typesetPromise([el]);` 包裹在 `try/catch` 中。
2. `catch` 分支中，将元素内容恢复为用户可读的原始公式（用 `$...$` / `$$...$$` 包裹）。
3. 给元素添加一个错误状态样式类（如 `mathjax-error`），方便后续 CSS 调整颜色。

## 验证步骤

1. **修改代码**：完成上述两处修改。
2. **类型检查**：`npx tsc --noEmit`
3. **启动应用**：`npm run dev`
4. **功能测试**：在聊天中输入包含以下内容的回复：
   - 含 `\chemfig` 的公式：`$\chemfig{*6(=--=--=)}$`
   - 普通公式：`$E=mc^2$`
   - 确认 `\chemfig` 公式不再触发 `404` 网络请求和 `Error: Can't load` 报错。
   - 确认 `\chemfig` 公式降级显示为原始文本（如 `$\chemfig{...}$`），而不是空白。
   - 确认普通公式仍然正常渲染为 SVG。

## 决策记录

- **为何不用 `noerrors` 扩展**：`noerrors` 只能处理 TeX 解析阶段的未定义命令，无法捕获扩展文件加载失败的网络错误。
- **为何不改用 `tex-svg.js`（非 full）**：非 full 版本依赖更多动态加载，反而更容易触发类似问题。
- **为何同时做配置禁用 + 代码降级**：配置禁用从源头消除 `404` 请求；代码降级作为兜底，防止任何其他未知扩展加载失败时页面崩溃。
