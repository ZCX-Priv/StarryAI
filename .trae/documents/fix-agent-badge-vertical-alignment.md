# 修复智能体卡片 Badge 垂直对齐问题

## 摘要
智能体卡片中的 "当前" / "自定义" badge (`span`) 在非自定义智能体卡片中视觉上偏下，与智能体名称不在同一水平线上。原因是普通 `.card-name` 未使用 flex 布局，导致 `inline-block` 的 badge 与 15px 的名称文字基线对齐时出现偏移。

## 当前状态分析

### 涉及文件
- `src/components/agents/AgentCard.tsx` — 组件结构
- `src/index.css` — 样式定义

### 问题根因
在 `src/index.css` 中：

```css
/* 第 395 行 */
.card-name { font-size: 15px; font-weight: 600; color: var(--text); margin-bottom: 4px; }

/* 第 400 行 */
.custom-agent .card-name { display: flex; align-items: center; gap: 6px; }

/* 第 402 行 */
.current-agent-badge { display: inline-block; padding: 2px 6px; background: var(--accent); color: #fff; font-size: 10px; font-weight: 600; border-radius: 4px; margin-left: 6px; }
```

- `.custom-agent .card-name` 使用了 `display: flex; align-items: center;`，所以**自定义智能体**的 badge 是垂直居中对齐的。
- 但普通 `.card-name`（非自定义智能体）是默认的块级盒子，内部的 `span` 是 `inline-block`。15px 名称文字与 10px badge 的默认基线对齐导致 badge 视觉上偏下。

### 期望效果
所有智能体卡片（无论是否自定义）中的名称与 badge 都应在同一水平线上垂直居中对齐。

## 变更方案

### 文件：`src/index.css`

#### 修改 1：给 `.card-name` 统一添加 flex 布局
将第 395 行：
```css
.card-name { font-size: 15px; font-weight: 600; color: var(--text); margin-bottom: 4px; }
```

修改为：
```css
.card-name { font-size: 15px; font-weight: 600; color: var(--text); margin-bottom: 4px; display: flex; align-items: center; gap: 6px; }
```

#### 修改 2：移除 `.custom-agent .card-name` 的重复声明
将第 400 行：
```css
.custom-agent .card-name { display: flex; align-items: center; gap: 6px; }
```

整行删除。因为 `.card-name` 已经统一具备这些属性，无需再为 `.custom-agent` 单独声明。

## 假设与决策
- 该修改只影响智能体卡片名称区域的布局，不会影响其他使用 `.card-name` 的地方（搜索确认仅 `AgentCard.tsx` 一处使用）。
- 统一使用 flex 布局是最简洁、最一致的修复方式，且与现有 `.custom-agent .card-name` 的实现保持一致。

## 验证步骤
1. 保存后刷新应用，打开智能体广场页面。
2. 观察当前选中的智能体卡片（带 "当前" badge）和非自定义智能体卡片，确认 badge 与名称文字在同一水平线上。
3. 观察自定义智能体卡片（带 "自定义" badge），确认布局未发生变化。
4. 运行 `npm run lint` 确认无异常。
