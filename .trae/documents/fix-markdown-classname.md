# 修复 react-markdown className 崩溃

## 问题

新版 `react-markdown` 移除了 `className` prop 支持，传入会直接抛出断言错误导致页面崩溃。

## 修复

修改 `src/render/MarkdownRenderer.jsx`：
- 移除 `ReactMarkdown` 上的 `className` prop
- 改为用外层 `<div>` 包裹并设置 `className`

```jsx
export default function MarkdownRenderer({ content, className }) {
  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
```

## 验证

发送消息后 AI 回复正常渲染，无崩溃。
