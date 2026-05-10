/* ─── Code Block Renderer ─────────────────────────────── */
const CodeRenderer = {
  _blockId: 0,

  escHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  highlight(code, lang) {
    if (typeof hljs === 'undefined' || lang === 'text') {
      return CodeRenderer.escHtml(code);
    }
    try {
      return hljs.highlight(code, { language: lang }).value;
    } catch {
      try {
        return hljs.highlightAuto(code).value;
      } catch {
        return CodeRenderer.escHtml(code);
      }
    }
  },

  renderCodeBlock(code, lang, options = {}) {
    const trimmed = code.trim();
    const langLabel = (lang || 'text').toLowerCase();
    const isLong = trimmed.split('\n').length > 8;
    const id = 'cb' + (CodeRenderer._blockId++);

    const collapseBtn = isLong
      ? `<button class="code-block-toggle" onclick="Renderer.toggleBlock(this,event)"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg> 展开</button>`
      : '';

    const highlighted = options.applyHljs !== false
      ? CodeRenderer.highlight(trimmed, langLabel)
      : CodeRenderer.escHtml(trimmed);

    return `<div class="code-block-wrap" onclick="Renderer.toggleBlockWrap(this,event)">
<div class="code-block-header"><span class="code-block-lang">${langLabel}</span><div class="code-block-actions">${collapseBtn}<button class="code-copy-btn" onclick="Renderer.copyCode('${id}',event)"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button></div></div>
<div class="${isLong ? 'code-block-body collapsed' : 'code-block-body'}"><pre id="${id}"><code class="hljs language-${langLabel}">${highlighted}</code></pre></div>
</div>`;
  },

  renderStreamingCodeBlock(code, lang) {
    const langLabel = lang || '代码';
    const escaped = CodeRenderer.escHtml(code);
    return `<div class="code-block-wrap"><div class="code-block-header"><span class="code-block-lang">${langLabel}</span></div><div class="code-block-body"><pre><code class="hljs">${escaped}</code></pre></div></div>`;
  },

  extractCodeBlocks(text) {
    const blocks = [];
    const placeholder = '\x00CODEBLOCK';
    let index = 0;

    const result = text.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
      const blockIndex = index++;
      blocks.push({
        lang: (lang || 'text').toLowerCase(),
        code: code.trim(),
        index: blockIndex
      });
      return `${placeholder}${blockIndex}\x00`;
    });

    return { text: result, blocks, placeholder };
  },

  restoreCodeBlocks(text, blocks, placeholder, options = {}) {
    const parts = text.split(placeholder);
    return parts.map((part, i) => {
      if (i === 0) return part;
      const nlPos = part.indexOf('\x00');
      const blockIndex = parseInt(part.slice(0, nlPos), 10);
      const block = blocks[blockIndex];
      const rest = part.slice(nlPos + 1);
      const blockHtml = block
        ? CodeRenderer.renderCodeBlock(block.code, block.lang, options)
        : '';
      return blockHtml + rest;
    }).join('');
  }
};
