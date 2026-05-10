# 模型列表显示上下文长度标签

## 需求分析

在模型选择器列表中显示每个模型支持的上下文长度，数据来源于 API 返回的 `context_length` 字段。

**显示格式规则：**
- 1000000 (100万) → 显示为 `1M` 标签
- 1048576 (约105万) → 显示为 `1M` 标签
- 262144 (约26万) → 显示为 `262K` 标签
- 400000 (40万) → 显示为 `400K` 标签

## 实现步骤

### 步骤 1：修改模型数据加载逻辑

**文件：** `js/keys.js`

在 `Keys._loadModels()` 方法中，从 API 返回的数据中提取 `context_length` 字段，添加到模型对象中。

**修改内容：**
```javascript
.map(m => ({
  id: m.name,
  label: m.aliases[0],
  pollen: m.pricing ? parseFloat(m.pricing.completionTextTokens) : null,
  paidOnly: m.paid_only || false,
  reasoning: m.reasoning || false,
  contextLength: m.context_length || null  // 新增：上下文长度
}));
```

### 步骤 2：创建上下文长度格式化函数

**文件：** `js/config.js`

添加一个格式化函数，将数字转换为 K/M 格式的标签。

**添加内容：**
```javascript
function formatContextLength(length) {
  if (!length) return null;
  if (length >= 1000000) {
    return (length / 1000000).toFixed(length % 1000000 === 0 ? 0 : 1) + 'M';
  }
  if (length >= 1000) {
    return Math.round(length / 1000) + 'K';
  }
  return length.toString();
}
```

### 步骤 3：修改模型选择器渲染逻辑

**文件：** `js/modals.js`

在 `Modals.renderModelPicker()` 方法中，为每个模型添加上下文长度标签显示。

**修改位置：** 第 64-78 行

**修改内容：**
- 在模型行中添加上下文长度标签元素
- 标签样式：小字体、灰色背景、圆角

### 步骤 4：添加 CSS 样式

**文件：** `css/modals.css` 或 `css/utilities.css`

为上下文长度标签添加样式。

**添加内容：**
```css
.mp-context-tag {
  font-size: 11px;
  color: var(--text3);
  background: var(--bg2);
  padding: 2px 6px;
  border-radius: 4px;
  flex-shrink: 0;
}
```

## 文件修改清单

| 文件 | 修改类型 | 说明 |
|------|----------|------|
| `js/keys.js` | 修改 | 在模型加载时提取 `context_length` |
| `js/config.js` | 新增 | 添加 `formatContextLength` 格式化函数 |
| `js/modals.js` | 修改 | 在模型选择器中显示上下文长度标签 |
| `css/modals.css` | 修改 | 添加标签样式 |

## 预期效果

模型选择器中每个模型将显示类似：
```
● DeepSeek                    1M  ✓
  Nova Fast                   128K
  Gemini                      1M
  Claude Fast                 200K
```
