# 修复 card-name 与 current-agent-badge 垂直对齐问题

## 问题分析

在 [AgentCard.tsx](file:///c:/Users/赵晨旭/Desktop/AIChat/src/components/agents/AgentCard.tsx#L35-L38) 中，`card-name` div 包含文本和 `current-agent-badge` span：

```html
<div className="card-name">
  {agent.name}
  {isCurrent && <span className="current-agent-badge">当前</span>}
</div>
```

在 [index.css](file:///c:/Users/赵晨旭/Desktop/AIChat/src/index.css#L395-L402) 中：

- `.card-name` 只有 `font-size: 15px; font-weight: 600; color: var(--text); margin-bottom: 4px;` — **没有 flex 布局**
- `.custom-agent .card-name` 才有 `display: flex; align-items: center; gap: 6px;` — 仅自定义智能体生效
- `.current-agent-badge` 使用 `display: inline-block; margin-left: 6px; font-size: 10px;`

**根因**：非自定义智能体（如"默认助手"）的 `.card-name` 没有 flex 布局，badge 用 `inline-block` 默认基线对齐，10px 字号 + padding 导致与 15px 文本视觉上错位。

## 修改方案

修改文件：[index.css](file:///c:/Users/赵晨旭/Desktop/AIChat/src/index.css)

1. **将 flex 布局从 `.custom-agent .card-name` 提升到 `.card-name`**，让所有智能体卡片名称行都使用 flex 居中对齐：
   - `.card-name` 添加 `display: flex; align-items: center; gap: 6px;`
   - 删除 `.custom-agent .card-name` 规则（已不需要）

2. **移除 `.current-agent-badge` 的 `margin-left: 6px;`**，因为 `gap: 6px` 已处理间距

## 验证

- 检查"默认助手"等非自定义智能体的"当前"徽章与名称文本垂直居中对齐
- 检查自定义智能体的"自定义"徽章同样对齐正常
- 运行 `npm run lint` 和 `npx tsc --noEmit` 确认无报错
