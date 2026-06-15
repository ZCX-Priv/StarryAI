# 修复预览窗口被限制在聊天消息区内的问题

## 摘要
HTML 预览窗口 (`HtmlPreviewDialog`) 当前被嵌套在聊天消息的代码块内部渲染，导致它受限于 `#chat-area` 的 `contain: layout style` 和 `.code-block` 的 `overflow: hidden`，只能显示在聊天消息区域内。需要通过 Portal 将其渲染到 `document.body`，使其覆盖整个页面窗口区。

## 当前状态分析

### 相关文件
- `src/components/modals/HtmlPreviewDialog.tsx` — 预览弹窗组件
- `src/render/CodeBlock.tsx` — 代码块组件，内部嵌套渲染了 `HtmlPreviewDialog`
- `src/index.css` — `#chat-area` 有 `contain: layout style;`，`.code-block` 有 `overflow: hidden;`

### 问题根因
1. `CodeBlock.tsx` 第 99–105 行在其 JSX 内部直接渲染了 `<HtmlPreviewDialog>`：
   ```tsx
   {showPreview && (
     <HtmlPreviewDialog ... />
   )}
   ```
2. 这导致 `HtmlPreviewDialog` 的 DOM 被放置在 `#chat-area` → `.messages-inner` → `.msg-row` → `.ai-msg-content` → `.markdown-body` → `.code-block` 的嵌套层级中。
3. `#chat-area` 定义了 `contain: layout style;`（CSS Containment），这会为 `position: fixed` 元素创建一个新的包含块，使其被限制在 `#chat-area` 范围内，而非整个视口。
4. `.code-block` 还有 `overflow: hidden;`，进一步裁剪了溢出内容。

## 提议的变更

### 文件：`src/components/modals/HtmlPreviewDialog.tsx`

**做什么**：使用 `ReactDOM.createPortal` 将模态框的 DOM 挂载到 `document.body`。

**为什么**：Portal 可以让组件在 React 树中保持原有位置（方便状态管理），但将 DOM 节点渲染到指定的容器（如 `document.body`）。这样模态框就能脱离 `#chat-area` 的 CSS Containment 约束，真正覆盖整个页面。

**如何实现**：
1. 导入 `createPortal` from `react-dom`。
2. 将原有的 `return (...)` 改为 `return createPortal(..., document.body)`。
3. `visible` 为 `false` 时仍然返回 `null`（不渲染任何内容）。

修改后的核心代码：
```tsx
import { createPortal } from 'react-dom';

export default function HtmlPreviewDialog({ visible, onClose, data }: HtmlPreviewDialogProps) {
  // ... useEffect 不变

  if (!visible) return null;

  const title = data?.lang ? `${String(data.lang).toUpperCase()} 预览` : 'HTML 预览';

  return createPortal(
    <div className="modal-overlay visible" onClick={...}>
      <div className="modal preview-modal" style={{ maxWidth: '960px' }}>
        {/* ... 内部结构不变 ... */}
      </div>
    </div>,
    document.body
  );
}
```

### 不修改的文件（排除项）
- `src/render/CodeBlock.tsx`：不需要移除内部的 `<HtmlPreviewDialog>` 调用。Portal 修复后，即使组件声明在此处，DOM 也会被挂载到 body，视觉表现正确。
- `src/components/layout/AppShell.tsx`：不需要调整顶层的 `HtmlPreviewDialog` 实例。
- `src/index.css`：不需要移除 `#chat-area` 的 `contain: layout style`，因为它对性能有益，且 Portal 方案已经绕过其影响。

## 假设与决策
- **使用 Portal 而非 Props Drilling**：Portal 是 React 官方推荐处理 Modal/Overlay 等需要跳出父容器 CSS 约束的场景的标准方案。相比把 `openModal` 从 `AppShell` → `ChatArea` → `MessageList` → `MessageBubble` → `MarkdownRenderer` → `CodeBlock` 层层传递，Portal 的侵入性最小，只需改一个文件。
- **保留 `AppShell` 和 `CodeBlock` 中的两个 `HtmlPreviewDialog` 实例**：Portal 修复后，两者功能均正常，且不会互相冲突。`AppShell` 中的实例用于全局调用，`CodeBlock` 中的实例用于代码块自包含调用。

## 验证步骤
1. 启动开发服务器，打开任意聊天会话。
2. 让 AI 返回一段 HTML 代码块，或手动发送包含 HTML 代码的消息。
3. 点击代码块右上角的“预览”按钮（眼睛图标）。
4. **预期结果**：预览弹窗的半透明黑色背景 (`modal-overlay`) 应该覆盖整个页面（包括侧边栏和输入区），而不仅仅覆盖聊天消息区域。
5. 点击关闭按钮或点击背景，弹窗应正常关闭。
