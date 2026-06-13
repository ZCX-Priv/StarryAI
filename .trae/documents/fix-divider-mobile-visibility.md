# 修复：移动端/小屏幕 `.divider` 消失问题

## 问题分析

在 `src/index.css` 第 439 行，`@media (max-width: 680px)` 媒体查询中设置了：

```css
.divider { display: none; }
```

这导致屏幕宽度 ≤ 680px 时，分隔线完全消失。

`.divider` 仅在 `src/components/chat/InputArea.tsx` 第 402 行使用，用于分隔"附件"按钮和"模式选择器"：

```tsx
<button className="action-btn" title="附件" id="attachBtn" type="button">
  <Paperclip size={18} />
</button>
<div className="divider" />
<ModeSelector />
```

## 修改方案

**文件**: `src/index.css`

**修改内容**: 删除第 439 行 `.divider { display: none; }`

在移动端，附件按钮和模式选择器之间仍然需要视觉分隔，隐藏 divider 会让两个按钮紧挨在一起，缺乏层次感。删除该规则后，divider 将使用基础样式（1px 宽、16px 高、`var(--border)` 颜色）正常显示。

## 验证步骤

1. 运行 `npm run dev` 启动开发服务器
2. 在浏览器中打开页面，使用 DevTools 切换到移动端视图（宽度 ≤ 680px）
3. 确认输入区域中附件按钮和模式选择器之间的竖线分隔符可见
4. 确认桌面端（宽度 > 680px）显示无变化

