/* ─── 思考内容渲染器 ─────────────────────────── */
const ThinkingRenderer = {
  _blockId: 0,
  _pairedTagPattern: /<think(?:\s[^>]*)?>([\s\S]*?)<\/think>/gi,
  _tokenPattern: /<\/?think(?:\s[^>]*)?>/gi,

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
    const pairedTagPattern = new RegExp(this._pairedTagPattern);

    let result = text.replace(pairedTagPattern, (match, content) => {
      blocks.push({ content: this.normalizeThinkingContent(content), index: index++ });
      return `${placeholder}${index - 1}\x00`;
    });

    return { text: result, blocks, placeholder };
  },

  normalizeThinkingContent(content) {
    return String(content || '')
      .replace(/^\s*<think(?:\s[^>]*)?>/i, '')
      .replace(/<\/think>\s*$/i, '')
      .replace(/\r\n/g, '\n')
      .trim();
  },

  renderThinkingBlock(content, isStreaming = false) {
    const normalizedContent = this.normalizeThinkingContent(content);
    const lines = normalizedContent.split('\n').map(line => line.trim()).filter(Boolean);

    if (lines.length === 0) {
      return '';
    }

    const stepsHtml = lines.map(line => {
      const stepContent = line.replace(/^[-*•]\s*/, '');
      const parsedContent = this.parseInline(this.escHtml(stepContent));
      return `<div class="thinking-step">${parsedContent}</div>`;
    }).join('');

    const statusText = isStreaming ? '思考中...' : '已完成思考';
    const blockClass = isStreaming ? 'thinking-block streaming' : 'thinking-block collapsed';
    
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
    return this.findOpenThinkingInfo(text) !== null;
  },

  findOpenThinkingPosition(text) {
    const openInfo = this.findOpenThinkingInfo(text);
    return openInfo ? openInfo.start : -1;
  },

  findOpenThinkingInfo(text) {
    if (!text) return null;

    let openInfo = null;
    let match;
    const tokenPattern = new RegExp(this._tokenPattern);

    while ((match = tokenPattern.exec(text)) !== null) {
      const token = match[0];
      const start = match.index;

      const isCloseTag = /^<\//.test(token);
      if (isCloseTag) {
        if (openInfo?.type === 'tag') {
          openInfo = null;
        }
        continue;
      }

      if (!openInfo) {
        openInfo = { type: 'tag', start, contentStart: start + token.length };
      }
    }

    return openInfo;
  }
};
