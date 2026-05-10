# 思考内容渲染功能实现计划

## 📋 任务概述
在 `render` 文件夹中新增 `thinking-content.js`，用于处理模型思考过程的渲染，将 🤔 标签中的内容渲染成类似参考文件中的思维链样式。

## 🎯 功能需求

### 核心功能
1. **提取思考内容**：从消息文本中提取 🤔 标签包裹的内容
2. **思维链渲染**：将思考内容渲染成可视化的思维链样式
3. **流式渲染支持**：支持思考过程的逐步显示
4. **交互功能**：提供展开/折叠功能

### 参考样式
参考 `c:\Users\赵晨旭\Desktop\AIChat\参考\ai-message-page.html` 中的思维链样式：
- Summary 区域：显示思考状态和参考数量
- Thread 区域：时间线样式的思考步骤
- Step 节点：每个思考步骤
- Chips 标签：搜索关键词和参考资料

## 📐 技术设计

### 1. ThinkingRenderer 对象结构
```javascript
const ThinkingRenderer = {
  // 提取思考块
  extractThinkingBlocks(text) { ... },
  
  // 渲染思考块
  renderThinkingBlock(content) { ... },
  
  // 恢复思考块
  restoreThinkingBlocks(text, blocks, placeholder) { ... },
  
  // 流式渲染思考块
  renderStreamingThinkingBlock(content) { ... }
}
```

### 2. 思考内容格式
假设模型返回的思考内容格式：
```
🤔 这是思考过程的标题
- 第一步思考内容
- 第二步思考内容
- 第三步思考内容
🤔
```

### 3. 渲染输出结构
```html
<div class="thinking-block">
  <div class="thinking-summary">
    <span class="thinking-status">已完成思考</span>
    <span class="thinking-caret"></span>
  </div>
  <div class="thinking-thread">
    <div class="thinking-step">思考步骤1</div>
    <div class="thinking-step">思考步骤2</div>
    ...
  </div>
</div>
```

## 🔧 实现步骤

### 步骤 1：创建 thinking-content.js 文件
- [ ] 创建 `js/render/thinking-content.js`
- [ ] 实现 `ThinkingRenderer` 对象
- [ ] 实现 `extractThinkingBlocks(text)` 方法
- [ ] 实现 `renderThinkingBlock(content)` 方法
- [ ] 实现 `restoreThinkingBlocks(text, blocks, placeholder)` 方法
- [ ] 实现 `renderStreamingThinkingBlock(content)` 方法

### 步骤 2：集成到 MarkdownRenderer
- [ ] 修改 `js/render/markdown.js`
- [ ] 在 `parseMarkdown` 方法中添加思考内容的提取和恢复逻辑
- [ ] 确保思考内容的处理顺序正确（在代码块和公式之后）

### 步骤 3：集成到流式渲染
- [ ] 修改 `js/render/index.js`
- [ ] 在 `renderStream` 方法中添加思考内容的流式渲染支持
- [ ] 实现 `_renderOpenThinkingBlock` 方法
- [ ] 处理思考块的 stable/live 区域渲染

### 步骤 4：添加 CSS 样式
- [ ] 在 `css/chat.css` 中添加思考块的样式
- [ ] 参考 `ai-message-page.html` 的样式设计
- [ ] 实现时间线、步骤节点、展开/折叠等样式
- [ ] 确保样式与现有主题兼容

### 步骤 5：引入文件
- [ ] 在 `index.html` 中引入 `thinking-content.js`
- [ ] 确保引入顺序正确（在 markdown.js 之后）

### 步骤 6：测试验证
- [ ] 测试思考内容的提取和渲染
- [ ] 测试流式渲染效果
- [ ] 测试展开/折叠功能
- [ ] 测试与其他渲染功能的兼容性

## 📝 详细实现说明

### extractThinkingBlocks 方法
```javascript
extractThinkingBlocks(text) {
  const placeholder = '___THINKING_BLOCK___';
  const blocks = [];
  let index = 0;
  
  const result = text.replace(/🤔([\s\S]*?)🤔/g, (match, content) => {
    blocks.push({ content: content.trim(), index: index++ });
    return `${placeholder}${index - 1}___`;
  });
  
  return { text: result, blocks, placeholder };
}
```

### renderThinkingBlock 方法
```javascript
renderThinkingBlock(content) {
  const lines = content.split('\n').filter(l => l.trim());
  const steps = lines.map(line => {
    // 移除列表标记
    const stepContent = line.replace(/^[-*•]\s*/, '');
    return `<div class="thinking-step">${this.parseInline(stepContent)}</div>`;
  }).join('');
  
  return `<div class="thinking-block">
    <div class="thinking-summary">
      <span class="thinking-status">已完成思考</span>
      <span class="thinking-caret"></span>
    </div>
    <div class="thinking-thread">${steps}</div>
  </div>`;
}
```

### 流式渲染处理
在 `renderStream` 方法中添加：
```javascript
const hasOpenThinking = this._hasUnclosedThinking(text);
if (hasOpenThinking) {
  this._renderOpenThinkingBlock(text, stable, live);
  return;
}
```

## 🎨 CSS 样式设计

### 核心样式
```css
.thinking-block {
  margin: 12px 0;
  border-left: 2px solid var(--border2);
  padding-left: 16px;
}

.thinking-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  cursor: pointer;
  color: var(--text2);
  font-size: 14px;
}

.thinking-thread {
  position: relative;
  padding-left: 20px;
}

.thinking-thread::before {
  content: "";
  position: absolute;
  left: 5px;
  top: 0;
  bottom: 0;
  width: 1.5px;
  background: var(--border2);
}

.thinking-step {
  position: relative;
  padding: 8px 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text);
}

.thinking-step::before {
  content: "";
  position: absolute;
  left: -20px;
  top: 14px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--text3);
}
```

## ⚠️ 注意事项

1. **兼容性**：确保思考内容的渲染不影响现有的代码块和公式渲染
2. **性能**：优化流式渲染性能，避免频繁的 DOM 操作
3. **样式一致性**：思考块的样式应与现有 UI 风格保持一致
4. **错误处理**：处理格式不正确的思考内容
5. **可访问性**：添加适当的 ARIA 标签

## 📊 预期效果

1. 模型返回包含 🤔 标签的思考内容时，自动渲染成思维链样式
2. 支持流式显示思考过程
3. 用户可以展开/折叠思考内容
4. 样式美观，与现有 UI 风格一致
5. 不影响其他内容的渲染

## 🔗 相关文件

- 新增：`js/render/thinking-content.js`
- 修改：`js/render/markdown.js`
- 修改：`js/render/index.js`
- 修改：`css/chat.css`
- 修改：`index.html`
- 参考：`c:\Users\赵晨旭\Desktop\AIChat\参考\ai-message-page.html`
