# 清理重复及废弃npm包计划

## 摘要
对项目依赖进行全面审计，移除未使用的废弃包，减少安装体积与维护负担。

## 当前状态分析

### 依赖审计结果
通过扫描 `package.json` 与整个 `src/` 目录的 import 语句，逐条核对所有依赖的实际使用情况：

| 包名 | 状态 | 使用位置 | 说明 |
|------|------|----------|------|
| `react` / `react-dom` | ✅ 使用中 | 核心框架 | 保留 |
| `zustand` | ✅ 使用中 | `src/status/*Store.ts` x9 | 保留 |
| `tailwindcss` / `@tailwindcss/vite` | ✅ 使用中 | `vite.config.ts`, `src/index.css` | 保留 |
| `react-markdown` | ✅ 使用中 | `src/render/MarkdownRenderer.tsx` | 保留 |
| `remark-gfm` | ✅ 使用中 | `src/render/MarkdownRenderer.tsx` | 保留 |
| `remark-math` | ✅ 使用中 | `src/render/MarkdownRenderer.tsx` | 保留 |
| `rehype-highlight` | ✅ 使用中 | `src/render/MarkdownRenderer.tsx` | 保留 |
| `highlight.js` | ✅ 使用中 | 被 `rehype-highlight` 依赖 + 直接 import CSS | 保留 |
| `mermaid` | ✅ 使用中 | `src/render/MermaidBlock.tsx` | 保留 |
| `mathjax` | ✅ 使用中 | `index.html` 通过 script 标签加载，`npm run copy-mathjax` 复制 | 保留 |
| `sonner` | ✅ 使用中 | `src/components/layout/AppShell.tsx`, `src/status/uiStore.ts` | 保留 |
| `lucide-react` | ✅ 使用中 | 大量组件 | 保留 |
| `idb` | ✅ 使用中 | `src/services/storage.ts` | 保留 |
| `@fontsource/inter` | ✅ 使用中 | `src/main.tsx` | 保留 |
| `rehype-mathjax` | ❌ **未使用** | **无任何 import** | **移除** |

### 关键发现
1. **废弃包：`rehype-mathjax`**
   - 在 `package.json` dependencies 中声明，但在整个 `src/` 目录中没有任何文件 import 它。
   - 项目实际使用数学公式渲染方案为：自定义组件 `MathJaxNode` + `index.html` 直接通过 `<script>` 标签加载 `/mathjax/tex-svg-full.js`。
   - `remark-math` 负责在 markdown 中识别数学公式语法，随后由自定义组件接管渲染，完全不经过 `rehype-mathjax` 管道。

2. **重复包：未发现明显功能重复**
   - 所有在用的包各司其职，没有出现两个包解决同一问题的场景。

## 拟议变更

### 文件：`package.json`
- **操作**：从 `dependencies` 中移除 `"rehype-mathjax": "^7.1.0"`

### 后续验证步骤
1. 执行 `npm install` 同步 `package-lock.json`，移除 `rehype-mathjax` 及其间接依赖。
2. 执行 `npm run lint` 确认 ESLint 无异常。
3. 执行 `npx tsc --noEmit` 确认 TypeScript 类型检查通过。
4. 启动开发服务器，验证 Markdown 数学公式渲染功能正常。

## 假设与决策
- 假设 `rehype-mathjax` 未被任何未纳入搜索范围的工具脚本或构建流程使用（经检查 `vite.config.ts` 及 `scripts` 确认无此情况）。
- 保留 `mathjax` 包，因为它通过 `copy-mathjax` 脚本为生产构建提供静态资源，即使源码中无 direct import。
