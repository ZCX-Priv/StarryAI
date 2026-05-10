/* ─── Renderer (Legacy Entry) ───────────────────────────
 * This file maintains backward compatibility by re-exporting
 * the modularized Renderer from js/render/index.js
 * ─────────────────────────────────────────────────────── */

const Renderer = window.Renderer || {
  _rafId: null,
  _rafPending: null,
  _lastRenderedText: null,
  _lastStableKey: null,

  escHtml(s) {
    return CodeRenderer.escHtml(s);
  },

  parseMarkdown(text, applyHljs = true) {
    return MarkdownRenderer.parseMarkdown(text, { applyHljs });
  },

  copyCode(id, e) {
    if (e) e.stopPropagation();
    const pre = document.getElementById(id);
    if (pre) {
      navigator.clipboard.writeText(pre.textContent).then(() => {
        UI.showToast('已复制！');
      });
    }
  },

  toggleBlock(btn, e) {
    if (e) e.stopPropagation();
    const body = btn.closest('.code-block-wrap').querySelector('.code-block-body');
    const collapsed = body.classList.toggle('collapsed');
    const pts = collapsed ? '6 9 12 15 18 9' : '18 15 12 9 6 15';
    btn.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="${pts}"/></svg> ${collapsed ? '展开' : '收起'}`;
  },

  toggleBlockWrap(wrap, e) {
    const body = wrap.querySelector('.code-block-body');
    if (!body) return;
    const btn = wrap.querySelector('.code-block-toggle');
    const collapsed = body.classList.toggle('collapsed');
    if (btn) {
      const pts = collapsed ? '6 9 12 15 18 9' : '18 15 12 9 6 15';
      btn.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="${pts}"/></svg> ${collapsed ? '展开' : '收起'}`;
    }
  },

  _zones(bubble) {
    let stable = bubble.querySelector(':scope > .sb-stable');
    let live = bubble.querySelector(':scope > .sb-live');
    if (!stable) {
      stable = document.createElement('div');
      stable.className = 'sb-stable';
      live = document.createElement('div');
      live.className = 'sb-live';
      bubble.innerHTML = '';
      bubble.appendChild(stable);
      bubble.appendChild(live);
    }
    return { stable, live };
  },

  scheduleStream(text, bubble) {
    this._rafPending = { text, bubble };
    if (!this._rafId) {
      this._rafId = requestAnimationFrame(() => {
        this._rafId = null;
        if (this._rafPending) {
          this.renderStream(this._rafPending.text, this._rafPending.bubble);
          this._rafPending = null;
          if (state.autoScroll) {
            UI.maybeScroll();
          }
        }
      });
    }
  },

  renderStream(text, bubble) {
    const { stable, live } = this._zones(bubble);

    const codeTicks = (text.match(/```/g) || []).length;
    const hasOpenCodeBlock = codeTicks % 2 === 1;

    if (hasOpenCodeBlock) {
      this._renderOpenCodeBlock(text, stable, live);
      return;
    }

    const hasOpenFormula = FormulaRenderer.hasUnclosedFormula(text);
    if (hasOpenFormula) {
      this._renderOpenFormula(text, stable, live);
      return;
    }

    const lastNL = text.lastIndexOf('\n');
    if (lastNL < 0) {
      this._renderSingleLine(text, stable, live);
      return;
    }

    this._renderMultiLine(text, lastNL, stable, live);
  },

  _renderOpenCodeBlock(text, stable, live) {
    let openPos = -1;
    for (let i = 0; i <= text.length - 3; i++) {
      if (text[i] === '`' && text[i + 1] === '`' && text[i + 2] === '`') {
        openPos = i;
        i += 2;
      }
    }

    const before = text.slice(0, openPos);
    const afterTick = text.slice(openPos + 3);
    const nlPos = afterTick.indexOf('\n');
    const lang = nlPos > -1 ? afterTick.slice(0, nlPos).trim() : afterTick.trim();
    const codeContent = nlPos > -1 ? afterTick.slice(nlPos + 1) : '';

    const stableHtml = before ? this.parseMarkdown(before, false) : '';
    if (stable.dataset.key !== stableHtml) {
      stable.innerHTML = stableHtml;
      stable.dataset.key = stableHtml;
    }

    live.innerHTML = CodeRenderer.renderStreamingCodeBlock(codeContent, lang);
  },

  _renderOpenFormula(text, stable, live) {
    const openPos = FormulaRenderer.findOpenFormulaPosition(text);

    if (openPos > 0) {
      const before = text.slice(0, openPos);
      const after = text.slice(openPos);

      const stableHtml = this.parseMarkdown(before, false);
      if (stable.dataset.key !== stableHtml) {
        stable.innerHTML = stableHtml;
        stable.dataset.key = stableHtml;
      }

      live.innerHTML = `<p>${this.escHtml(after)}</p>`;
    } else {
      if (stable.dataset.key !== '') {
        stable.innerHTML = '';
        stable.dataset.key = '';
      }
      live.innerHTML = `<p>${this.escHtml(text)}</p>`;
    }
  },

  _renderSingleLine(text, stable, live) {
    if (stable.dataset.key !== '') {
      stable.innerHTML = '';
      stable.dataset.key = '';
    }
    live.innerHTML = text ? `<p>${this.escHtml(text)}</p>` : '';
  },

  _renderMultiLine(text, lastNL, stable, live) {
    const completePart = text.slice(0, lastNL + 1);
    const incompletePart = text.slice(lastNL + 1);

    if (stable.dataset.key !== completePart) {
      stable.innerHTML = this.parseMarkdown(completePart, false);
      stable.dataset.key = completePart;
      
      this._scheduleRender(stable);
    }

    live.innerHTML = incompletePart ? `<p>${this.escHtml(incompletePart)}</p>` : '';
  },

  _scheduleRender(element) {
    if (this._renderTimer) {
      clearTimeout(this._renderTimer);
    }
    
    this._renderTimer = setTimeout(() => {
      FormulaRenderer.typeset(element);
      
      this._highlightCodeBlocks(element);
      
      this._renderTimer = null;
    }, 100);
  },

  _highlightCodeBlocks(element) {
    if (typeof hljs === 'undefined') return;
    
    const codeBlocks = element.querySelectorAll('pre code:not(.hljs)');
    codeBlocks.forEach(block => {
      try {
        hljs.highlightElement(block);
      } catch (e) {
        console.warn('Code highlight error:', e);
      }
    });
  },

  finalizeRender(bubble, text) {
    bubble.innerHTML = this.parseMarkdown(text);
    FormulaRenderer.typeset(bubble);
    this._highlightCodeBlocks(bubble);
  }
};
