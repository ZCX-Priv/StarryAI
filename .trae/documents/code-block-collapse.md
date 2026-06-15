# 代码块超过5行自动收起计划

## 需求
- 代码块超过5行时自动收起，只显示前5行
- AI正在生成时，收起后视口仍能正常自动滚动到底部
- AI未在生成时，显示正常的收起/展开交互

## 当前状态分析

### 关键文件
- `src/render/CodeBlock.tsx` — 代码块组件，当前无收起逻辑，无流式状态感知
- `src/render/MarkdownRenderer.tsx` — Markdown渲染器，将 `children` 传给 CodeBlock，无流式状态传递
- `src/components/chat/MessageBubble.tsx` — 消息气泡，已有 `isStreaming` prop，调用 `<MarkdownRenderer content={mainContent} />`
- `src/index.css` — 全局样式，包含 `.code-block` 系列样式

### 数据流
- `MessageList` 计算 `isStreaming` → 传给 `MessageBubble`
- `MessageBubble` 有 `isStreaming` 但未传给 `MarkdownRenderer`
- `MarkdownRenderer` 和 `CodeBlock` 完全不知道流式状态

## 实现方案

### 方案：通过 MarkdownRenderer 传递 isStreaming 给 CodeBlock

选择 prop 传递而非 context，因为链路短（仅2层），且更直观。

### 修改文件与内容

#### 1. `src/render/MarkdownRenderer.tsx`

- 新增 `isStreaming?: boolean` prop
- 将 `isStreaming` 传递给 `CodeBlock` 组件

```tsx
interface MarkdownRendererProps {
  content: string;
  className?: string;
  isStreaming?: boolean;  // 新增
}

// pre 组件中：
<CodeBlock language={lang} code={codeText} isStreaming={isStreaming}>
  {children}
</CodeBlock>
```

#### 2. `src/render/CodeBlock.tsx`

- 新增 `isStreaming?: boolean` prop
- 通过 `code.split('\n')` 计算行数
- 超过5行时默认收起，只显示前5行高度
- 收起状态下，点击"展开"按钮显示全部内容
- 展开状态下，点击"收起"按钮回到收起状态
- 收起时使用 CSS `max-height` + `overflow: hidden` 实现截断，确保流式输出时视口滚动不受影响

关键逻辑：
```tsx
const COLLAPSE_THRESHOLD = 5;
const lineCount = code.split('\n').length;
const shouldCollapsible = lineCount > COLLAPSE_THRESHOLD;
const [expanded, setExpanded] = useState(false);
```

收起时 `.code-block-content` 添加 `max-height` 限制（约5行高度，按 line-height 1.6 + font-size 0.9em ≈ 14.5*0.9*1.6 ≈ 20.88px/行，5行 ≈ 104px + 14px padding-top ≈ 118px），使用 CSS 变量或直接计算。

展开/收起按钮放在 `.code-block-content` 下方，样式与现有 `.code-block-btn` 一致。

#### 3. `src/components/chat/MessageBubble.tsx`

- 将 `isStreaming` 传递给 `MarkdownRenderer`

```tsx
<MarkdownRenderer content={mainContent} isStreaming={isStreaming} />
```

#### 4. `src/index.css`

- 添加 `.code-block-collapse` 样式（收起状态的 max-height + overflow + 渐变遮罩）
- 添加 `.code-block-expand-btn` 样式（展开/收起按钮）

### streaming 时的自动滚动行为

当 `isStreaming` 为 true 且代码块处于收起状态时，代码块容器需要像终端一样自动滚动到最底部，始终显示最新生成的代码行。

实现方式：
- 收起状态的 `.code-block-content` 使用 `overflow: auto` 但隐藏滚动条（`scrollbar-width: none; ::-webkit-scrollbar { display: none; }`）
- 在 `CodeBlock` 中用 `useRef` 获取内容容器 DOM
- `useEffect` 监听 `code` 变化：当 `isStreaming && !expanded && shouldCollapsible` 时，执行 `contentRef.current.scrollTop = contentRef.current.scrollHeight`
- streaming 结束后，不再自动滚动，停留在当前显示位置（即最后一部分代码）

### 收起时的视觉效果

收起时底部添加渐变遮罩（从透明到代码块背景色），让截断效果更自然。展开按钮叠加在渐变遮罩上方。

### 行数计算说明

使用 `code` prop（纯文本）的换行符数量计算，而非 DOM 测量。这样更可靠且不受渲染时机影响。

## 验证步骤

1. 发送消息让AI返回超过5行的代码块 → 验证默认收起，只显示5行
2. 点击展开按钮 → 验证完整代码显示
3. 点击收起按钮 → 验证回到5行收起状态
4. 流式输出期间 → 验证收起状态下视口仍能自动滚动
5. 5行及以下的代码块 → 验证不显示收起/展开按钮
6. 亮色/暗色模式 → 验证渐变遮罩颜色正确
7. 运行 `npm run lint` 和 `npx tsc --noEmit`
