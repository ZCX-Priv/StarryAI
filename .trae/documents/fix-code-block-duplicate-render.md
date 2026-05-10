# 代码块重复渲染问题修复计划

## 问题分析

当前存在两个代码块渲染方法：
- `renderStreamingCodeBlock`: 流式输出时使用，结构简化
- `renderCodeBlock`: 最终渲染时使用，结构完整

这导致流式输出时和完成后的代码块外观不一致，造成重复渲染的视觉问题。

## 解决方案

### 统一为一个渲染方法

删除 `renderStreamingCodeBlock`，只保留 `renderCodeBlock`，所有场景都使用同一个方法。

### 修改内容

#### 文件 1: `js/render/code.js`

**删除 `renderStreamingCodeBlock` 方法**（第49-63行）

**修改 `renderCodeBlock` 方法**：
- 所有代码块默认折叠
- 统一的 header 结构（语言标签 + 复制按钮）
- 流式渲染和最终渲染使用同一个方法

```javascript
renderCodeBlock(code, lang, options = {}) {
  const trimmed = code.trim();
  const langLabel = (lang || 'text').toLowerCase();
  const id = 'cb' + (CodeRenderer._blockId++);

  const highlighted = options.applyHljs !== false
    ? CodeRenderer.highlight(trimmed, langLabel)
    : CodeRenderer.escHtml(trimmed);

  return `<div class="code-block-wrap" onclick="Renderer.toggleBlockWrap(this,event)">
<div class="code-block-header"><span class="code-block-lang">${langLabel}</span><div class="code-block-actions"><button class="code-copy-btn" onclick="Renderer.copyCode('${id}',event)"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button></div></div>
<div class="code-block-body collapsed"><pre id="${id}"><code class="hljs language-${langLabel}">${highlighted}</code></pre></div>
</div>`;
}
```

#### 文件 2: `js/render/index.js`

**修改 `_renderOpenCodeBlock` 方法**：
- 将 `CodeRenderer.renderStreamingCodeBlock` 改为 `CodeRenderer.renderCodeBlock`

#### 文件 3: `js/chat.js`

**删除流式结束后的折叠检查代码**：
- 删除第147-158行（`_streamResponse` 中的折叠逻辑）
- 删除第234-244行（`regenerate` 中的折叠逻辑）

## 预期效果

1. 流式输出时，代码块立即显示完整的结构
2. 代码块完成后，不会有任何重新渲染
3. 所有代码块默认折叠
4. 统一的视觉效果
