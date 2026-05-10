/* ─── Markdown Renderer ───────────────────────────────── */
const MarkdownRenderer = {

  escHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  formatText(s) {
    if (!s.trim()) return '';
    s = s.replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br>');
    if (!s.match(/^<(h[1-6]|ul|ol|blockquote|hr|p|div|table)/)) s = `<p>${s}</p>`;
    s = this.fixBlockSpacing(s);
    return s;
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

    s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">');

    return s;
  },

  parseBlock(text) {
    let s = text;

    s = s.replace(/^###### (.+)$/gm, '<h6>$1</h6>');
    s = s.replace(/^##### (.+)$/gm, '<h5>$1</h5>');
    s = s.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
    s = s.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    s = s.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    s = s.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    s = s.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');

    s = s.replace(/^---+$/gm, '<hr>');
    s = s.replace(/^\*\*\*+$/gm, '<hr>');
    s = s.replace(/^___+$/gm, '<hr>');

    s = s.replace(/^(\s*[-*+] .+(\n\s*[-*+] .+)*)/gm, (match) => {
      const items = match.trim().split('\n').map(l => {
        const checked = l.match(/^\s*[-*+] \[x\] /i);
        const unchecked = l.match(/^\s*[-*+] \[ \] /);
        if (checked) {
          return `<li class="task-item"><input type="checkbox" checked disabled>${l.replace(/^\s*[-*+] \[x\] /i, '')}</li>`;
        }
        if (unchecked) {
          return `<li class="task-item"><input type="checkbox" disabled>${l.replace(/^\s*[-*+] \[ \] /, '')}</li>`;
        }
        return `<li>${l.replace(/^\s*[-*+] /, '')}</li>`;
      }).join('');
      return `<ul>${items}</ul>`;
    });

    s = s.replace(/^(\s*\d+\. .+(\n\s*\d+\. .+)*)/gm, (match) => {
      const items = match.trim().split('\n').map(l => `<li>${l.replace(/^\s*\d+\. /, '')}</li>`).join('');
      return `<ol>${items}</ol>`;
    });

    s = this.parseTable(s);

    return s;
  },

  parseTable(text) {
    const tableRegex = /^\|(.+)\|\n\|[-:\s|]+\|\n((?:\|.+\|\n?)+)/gm;
    
    return text.replace(tableRegex, (_, headerRow, bodyRows) => {
      const headers = headerRow.split('|').map(h => h.trim()).filter(h => h);
      const headerHtml = headers.map(h => `<th>${this.parseInline(h)}</th>`).join('');
      
      const rows = bodyRows.trim().split('\n').map(row => {
        const cells = row.split('|').map(c => c.trim()).filter(c => c);
        return `<tr>${cells.map(c => `<td>${this.parseInline(c)}</td>`).join('')}</tr>`;
      }).join('');
      
      return `<table><thead><tr>${headerHtml}</tr></thead><tbody>${rows}</tbody></table>`;
    });
  },

  parseMarkdown(text, options = {}) {
    if (!text) return '';

    let s = text;

    const codeResult = CodeRenderer.extractCodeBlocks(s);
    s = codeResult.text;
    const codeBlocks = codeResult.blocks;
    const codePlaceholder = codeResult.placeholder;

    const formulaResult = FormulaRenderer.extractFormulas(s);
    s = formulaResult.text;
    const formulas = formulaResult.formulas;
    const formulaPlaceholder = formulaResult.placeholder;

    const thinkingResult = ThinkingRenderer.extractThinkingBlocks(s);
    s = thinkingResult.text;
    const thinkingBlocks = thinkingResult.blocks;
    const thinkingPlaceholder = thinkingResult.placeholder;

    s = this.escHtml(s);

    s = this.parseBlock(s);
    s = this.parseInline(s);

    s = FormulaRenderer.restoreFormulas(s, formulas, formulaPlaceholder);

    s = CodeRenderer.restoreCodeBlocks(s, codeBlocks, codePlaceholder, options);

    s = ThinkingRenderer.restoreThinkingBlocks(s, thinkingBlocks, thinkingPlaceholder);

    s = this.formatText(s);

    s = this.fixNestedBlocks(s);

    return s;
  },

  fixNestedBlocks(text) {
    let s = text;

    s = s.replace(/<\/blockquote><blockquote>/g, '\n');
    s = s.replace(/<\/ul><ul>/g, '\n');
    s = s.replace(/<\/ol><ol>/g, '\n');

    return s;
  },

  fixBlockSpacing(text) {
    let s = text;
    const blockTag = '(?:div|table|blockquote|ul|ol|h[1-6]|hr)';

    s = s.replace(new RegExp(`<br>\\s*(<${blockTag}\\b[^>]*>)`, 'g'), '$1');
    s = s.replace(new RegExp(`(<\\/${blockTag}>|<hr[^>]*>)\\s*<br>`, 'g'), '$1');
    s = s.replace(new RegExp(`<p>\\s*(<${blockTag}\\b[^>]*>)`, 'g'), '$1');
    s = s.replace(new RegExp(`(<\\/${blockTag}>|<hr[^>]*>)\\s*<\\/p>`, 'g'), '$1');

    return s;
  }
};
