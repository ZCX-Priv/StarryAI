# 删除无用/重复依赖包计划

## 概述
项目 package.json 中存在 9 个未使用或重复的依赖包，需要清理。

## 当前状态分析

### 可安全移除的 dependencies（7个）

| 包名 | 未使用原因 |
|---|---|
| `better-react-mathjax` | 整个 src/ 无任何 import |
| `clsx` | 整个 src/ 无任何 import，项目代码用原生数组方法拼接类名 |
| `highlight.js` | 无直接 import；`rehype-highlight` 会自动将其作为 peer dependency 安装 |
| `mathjax` | 无任何 import；`better-react-mathjax` 自带 MathJax，且两者都未使用 |
| `mermaid` | 整个 src/ 无任何 import |
| `react-syntax-highlighter` | 整个 src/ 无任何 import，项目用 `rehype-highlight` 做代码高亮 |
| `remark-math` | 整个 src/ 无任何 import，MarkdownRenderer 未使用此插件 |

### 可安全移除的 devDependencies（2个）

| 包名 | 未使用原因 |
|---|---|
| `@types/react-syntax-highlighter` | 主包 `react-syntax-highlighter` 未使用 |
| `vite-plugin-static-copy` | `vite.config.ts` 中未引入此插件 |

### 重复/重叠说明
- **语法高亮**：项目用 `rehype-highlight`（Markdown 管道插件），不需要 `react-syntax-highlighter`（独立组件）和显式的 `highlight.js`
- **数学公式**：`better-react-mathjax` + `mathjax` + `remark-math` 三者均未使用

## 执行步骤

1. 从 package.json 的 dependencies 中移除以下 7 个包：
   - `better-react-mathjax`
   - `clsx`
   - `highlight.js`
   - `mathjax`
   - `mermaid`
   - `react-syntax-highlighter`
   - `remark-math`

2. 从 package.json 的 devDependencies 中移除以下 2 个包：
   - `@types/react-syntax-highlighter`
   - `vite-plugin-static-copy`

3. 运行 `npm install` 更新 node_modules 和 package-lock.json

4. 运行 `npm run build` 验证项目构建正常

5. 运行 `npm run lint` 验证无 lint 错误

## 验证
- 构建成功（`npm run build`）
- Lint 通过（`npm run lint`）
- 项目功能不受影响（移除的包均无代码引用）
