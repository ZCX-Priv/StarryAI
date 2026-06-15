# 修复代码块展开状态丢失 Bug

## 问题描述
AI 停止生成后，用户手动展开代码块并向下滚动，代码块被强制收起。

## 根因分析
`CodeBlock` 组件的 `expanded` 状态使用 `useState(false)` 存储。当 `MarkdownRenderer` 重新渲染时（如 `isStreaming` 从 true 变为 false，或消息内容更新），`react-markdown` 会重新生成虚拟 DOM 树，导致 `CodeBlock` 组件实例被重新创建，`expanded` 状态丢失并回到默认值 `false`（收起）。

## 修复方案

### 修改文件：`src/render/CodeBlock.tsx`

将展开状态从组件内部 `useState` 提升到模块级 `Map` 中持久化存储，组件重新挂载时从 Map 恢复状态。

具体改动：
1. 在模块级添加 `const collapseStateMap = new Map<string, boolean>()`
2. 构造 `codeKey`：`${language}:${code.length}:${code.slice(0, 200)}`，在同一条消息中足够唯一
3. `useState` 初始值改为从 Map 读取：`useState(() => collapseStateMap.get(codeKey) ?? false)`
4. 展开/收起按钮的 onClick 中，更新 Map：`collapseStateMap.set(codeKey, nextExpanded)`
5. 在 `useEffect` 中也同步 Map，确保状态一致

### 不修改其他文件

- `MarkdownRenderer.tsx`、`MessageBubble.tsx`、`index.css` 均无需改动

## 验证步骤

1. AI 生成超过5行的代码块 → 默认收起
2. 点击展开 → 代码块展开显示全部
3. 向下滚动聊天区域 → 代码块保持展开状态，不再强制收起
4. 点击收起 → 代码块收起
5. 刷新页面或切换聊天再回来 → 代码块回到默认收起状态（Map 在页面刷新后清空，符合预期）
6. 运行 `npx tsc --noEmit` 确保类型正确
