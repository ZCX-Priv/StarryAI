/* ─── Thinking Content Renderer ─────────────────────────── */
const ThinkingRenderer = {
  _blockId: 0,

  escHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  parseInline(text) {
    let s = text;
    s = s.replace(/`([^`\n]+)`/g, '<code>$1</code>');
    s = s.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');
    s = s.replace(/__(.+?)__/g, '<strong>$1</strong>');
    s = s.replace(/_(.+?)_/g, '<em>$1</em>');
    s = s.replace(/~~(.+?)~~/g, '<del>$1</del>');
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    return s;
  },

  toggleThinking(element) {
    const thinkingBlock = element.closest('.thinking-block');
    if (thinkingBlock) {
      thinkingBlock.classList.toggle('collapsed');
    }
  },

  extractThinkingBlocks(text) {
    const placeholder = '\x00THINKINGBLOCK';
    const blocks = [];
    let index = 0;
    
    const result = text.replace(/🤔([\s\S]*?)🤔/g, (match, content) => {
      blocks.push({ content: content.trim(), index: index++ });
      return `${placeholder}${index - 1}\x00`;
    });
    
    return { text: result, blocks, placeholder };
  },

  renderThinkingBlock(content, isStreaming = false) {
    const lines = content.split('\n').filter(l => l.trim());
    
    if (lines.length === 0) {
      return '';
    }

    const title = lines[0];
    const steps = lines.slice(1);
    
    const stepsHtml = steps.map(line => {
      const stepContent = line.replace(/^[-*•]\s*/, '');
      const parsedContent = this.parseInline(this.escHtml(stepContent));
      return `<div class="thinking-step">${parsedContent}</div>`;
    }).join('');

    const statusText = isStreaming ? '思考中...' : '已完成思考';
    const blockClass = isStreaming ? 'thinking-block streaming' : 'thinking-block';
    
    return `<div class="${blockClass}">
      <div class="thinking-summary" onclick="ThinkingRenderer.toggleThinking(this)">
        <span class="thinking-status">${statusText}</span>
        <span class="thinking-caret" aria-hidden="true"></span>
      </div>
      <div class="thinking-thread">
        ${stepsHtml}
      </div>
    </div>`;
  },

  renderStreamingThinkingBlock(content) {
    return this.renderThinkingBlock(content, true);
  },

  restoreThinkingBlocks(text, blocks, placeholder) {
    const parts = text.split(placeholder);
    return parts.map((part, i) => {
      if (i === 0) return part;
      const nlPos = part.indexOf('\x00');
      const blockIndex = parseInt(part.slice(0, nlPos), 10);
      const rest = part.slice(nlPos + 1);
      
      if (blocks[blockIndex]) {
        return this.renderThinkingBlock(blocks[blockIndex].content) + rest;
      }
      return rest;
    }).join('');
  },

  hasUnclosedThinking(text) {
    const thinkingEmojis = (text.match(/🤔/g) || []).length;
    return thinkingEmojis % 2 === 1;
  },

  findOpenThinkingPosition(text) {
    let count = 0;
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '🤔') {
        count++;
        if (count % 2 === 1 && i < text.length - 1) {
          return i;
        }
      }
    }
    return -1;
  }
};
