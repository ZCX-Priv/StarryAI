# 修复 Streaming 期间手动展开被强制收起 Bug

## 问题描述
AI 生成过程中，用户手动展开代码块，代码块立马被强制收起。

## 根因分析
`CodeBlock` 使用模块级 `Map` 持久化展开状态，key 为：
```ts
const codeKey = `${language}:${code.length}:${code.slice(0, 200)}`
```

Streaming 期间 `code` 不断变化，`codeKey` 也随之不断变化。虽然 `useState` 的初始值会从 Map 读取，但当 React 因 rehype-highlight 语法高亮结果变化（streaming 时 token 解析结构不稳定）而重新挂载 `CodeBlock` 组件时，新的 `codeKey` 在 Map 中找不到对应值，`expanded` 回到默认值 `false`（收起）。

简单说：**streaming 期间 codeKey 不稳定，导致持久化失效**。

## 修复方案

### 修改文件：`src/render/CodeBlock.tsx`

将 `codeKey` 从依赖完整 code 内容（`code.length + code.slice(0,200)`）改为依赖**前3行代码**。

```ts
const codeKey = useMemo(() => {
  const prefix = code.split('\n').slice(0, 3).join('\n');
  return `${language}:${prefix}`;
}, [language, code]);
```

**原因**：LLM 生成代码是从上到下逐 token 生成的。当代码块超过5行（满足收起阈值）时，前3行通常已经生成完毕且不再变化。因此基于前3行的 key 在 streaming 期间足够稳定，能正确匹配持久化状态。

附加保险：添加 `useLayoutEffect` 在组件挂载/更新时从 Map 恢复展开状态，确保即使组件重新挂载也能正确恢复。

### 不修改其他文件

- `MarkdownRenderer.tsx`、`MessageBubble.tsx`、`index.css` 均无需改动

## 验证步骤

1. AI 生成超过5行的代码块 → 默认收起
2. 在 AI 仍在生成时，点击展开 → 代码块展开并保持展开
3. AI 继续生成新代码 → 代码块保持展开状态，不再强制收起
4. AI 生成结束后 → 代码块保持展开
5. 点击收起 → 代码块收起
6. 运行 `npx tsc --noEmit`
