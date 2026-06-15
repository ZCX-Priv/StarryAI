# 修复 rehype-mathjax "require is not defined" 错误

## 问题

`rehype-mathjax` 默认入口（SVG/CHTML）依赖 `mathjax-full`，后者内部使用 `require()` 加载模块，在浏览器/Vite 环境中会抛出 `ReferenceError: require is not defined`。

## 根因

`rehype-mathjax` 提供多个入口：
- `rehype-mathjax`（默认）→ 使用 `mathjax-full` 在服务端/构建时渲染，依赖 `require()`
- `rehype-mathjax/browser` → 专为浏览器设计，约 1kb，不依赖 `mathjax-full`
- `rehype-mathjax/chtml` → CHTML 输出，同样依赖 `mathjax-full`
- `rehype-mathjax/svg` → SVG 输出，同样依赖 `mathjax-full`

我们当前 `import rehypeMathjax from 'rehype-mathjax'` 使用了默认入口，触发了 `require()` 调用。

## 修复方案

**仅修改一个文件**：`src/render/MarkdownRenderer.tsx`

将第 6 行：
```typescript
import rehypeMathjax from 'rehype-mathjax';
```

改为：
```typescript
import rehypeMathjax from 'rehype-mathjax/browser';
```

`rehype-mathjax/browser` 入口是专为浏览器环境设计的轻量版本，不会触发 `require()` 调用。它通过客户端 MathJax 脚本在浏览器中渲染公式，而非在构建时渲染。

## 注意事项

- `rehype-mathjax/browser` 的 `tex.packages` 配置方式与默认入口相同，mhchem 宏包配置不受影响
- 浏览器入口会在客户端动态渲染公式（而非构建时预渲染），这对我们的场景（动态 AI 回复内容）是正确的行为
- 无需修改其他文件

## 验证

修改后启动 dev server，发送包含 `$E=mc^2$` 或 `$$\int_0^1 x^2 dx$$` 的消息，确认公式正常渲染且控制台无错误。
