/* ─── Render Module Entry ────────────────────────────────
 * This file provides the main Renderer object for the application.
 * ─────────────────────────────────────────────────────── */

const Renderer = {
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

  canPreviewCode(lang) {
    const normalized = String(lang || '').toLowerCase();
    return normalized === 'html' || normalized === 'htm';
  },

  previewCode(id, lang, e) {
    if (e) e.stopPropagation();
    if (!this.canPreviewCode(lang)) return;
    const pre = document.getElementById(id);
    if (!pre) return;
    Modals.openHtmlPreview(pre.textContent, lang);
  },

  _setCodeToggleState(btn, collapsed) {
    if (!btn) return;
    const pts = collapsed ? '6 9 12 15 18 9' : '18 15 12 9 6 15';
    btn.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="${pts}"/></svg> ${collapsed ? '展开' : '收起'}`;
  },

  toggleBlock(btn, e) {
    if (e) e.stopPropagation();
    const body = btn.closest('.code-block-wrap').querySelector('.code-block-body');
    const collapsed = body.classList.toggle('collapsed');
    this._setCodeToggleState(btn, collapsed);
  },

  toggleBlockWrap(wrap, e) {
    const body = wrap.querySelector('.code-block-body');
    if (!body) return;
    const btn = wrap.querySelector('.code-block-toggle');
    const collapsed = body.classList.toggle('collapsed');
    this._setCodeToggleState(btn, collapsed);
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

  _setHtmlIfChanged(element, html) {
    const next = html || '';
    if (element.dataset.htmlKey === next) return false;
    element.innerHTML = next;
    element.dataset.htmlKey = next;
    return true;
  },

  _setParagraphText(live, text) {
    const next = text || '';
    if (live.dataset.textKey === next) return;

    let paragraph = live.querySelector(':scope > p');
    if (!paragraph || live.children.length > 1) {
      live.innerHTML = '';
      paragraph = document.createElement('p');
      live.appendChild(paragraph);
    }

    paragraph.textContent = next;
    live.dataset.textKey = next;
    live.dataset.htmlKey = '';
  },

  _clearLive(live) {
    if (!live.dataset.textKey && !live.dataset.htmlKey && !live.innerHTML) return;
    live.innerHTML = '';
    live.dataset.textKey = '';
    live.dataset.htmlKey = '';
  },

  scheduleStream(text, bubble) {
    this._rafPending = { text, bubble };
    if (!this._rafId) {
      this._rafId = requestAnimationFrame(() => {
        this._rafId = null;
        if (this._rafPending) {
          this.renderStream(this._rafPending.text, this._rafPending.bubble);
          this._rafPending = null;
          UI.maybeScroll();
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

    const hasOpenThinking = ThinkingRenderer.hasUnclosedThinking(text);
    if (hasOpenThinking) {
      this._renderOpenThinkingBlock(text, stable, live);
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

    const normalizedLang = (lang || 'text').toLowerCase();
    const existingWrap = live.querySelector(':scope > .code-block-wrap');

    if (!existingWrap) {
      this._setHtmlIfChanged(live, CodeRenderer.renderCodeBlock(codeContent, normalizedLang, {
        collapsed: false,
        applyHljs: true
      }));
      return;
    }

    const body = existingWrap.querySelector('.code-block-body');
    const pre = existingWrap.querySelector('pre');
    const codeEl = existingWrap.querySelector('pre code');
    const langEl = existingWrap.querySelector('.code-block-lang');
    const actions = existingWrap.querySelector('.code-block-actions');
    const copyBtn = existingWrap.querySelector('.code-copy-btn');
    const toggleBtn = existingWrap.querySelector('.code-block-toggle');
    const codeId = pre?.id || ('cb' + (CodeRenderer._blockId++));
    const trimmedCode = codeContent.trim();

    if (pre && !pre.id) {
      pre.id = codeId;
    }
    if (langEl) {
      langEl.textContent = normalizedLang;
    }
    if (codeEl) {
      codeEl.className = `hljs language-${normalizedLang}`;
      const highlightedCode = CodeRenderer.highlight(trimmedCode, normalizedLang);
      if (codeEl.innerHTML !== highlightedCode) {
        codeEl.innerHTML = highlightedCode;
      }
    }
    if (copyBtn) {
      copyBtn.setAttribute('onclick', `Renderer.copyCode('${codeId}',event)`);
    }

    let previewBtn = existingWrap.querySelector('.code-preview-btn');
    if (this.canPreviewCode(normalizedLang)) {
      if (!previewBtn && actions) {
        previewBtn = document.createElement('button');
        previewBtn.className = 'code-preview-btn';
        previewBtn.title = '预览 HTML';
        previewBtn.innerHTML = '<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="8,6 19,12 8,18"/></svg>';
        actions.insertBefore(previewBtn, copyBtn || null);
      }
      if (previewBtn) {
        previewBtn.setAttribute('onclick', `Renderer.previewCode('${codeId}','${normalizedLang}',event)`);
      }
    } else if (previewBtn) {
      previewBtn.remove();
    }

    if (body) {
      body.classList.remove('collapsed');
    }
    this._setCodeToggleState(toggleBtn, false);
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

      this._setParagraphText(live, after);
    } else {
      if (stable.dataset.key !== '') {
        stable.innerHTML = '';
        stable.dataset.key = '';
      }
      this._setParagraphText(live, text);
    }
  },

  _renderOpenThinkingBlock(text, stable, live) {
    const openInfo = ThinkingRenderer.findOpenThinkingInfo(text);

    if (openInfo) {
      const before = text.slice(0, openInfo.start);
      const after = text.slice(openInfo.contentStart);

      const stableHtml = before ? this.parseMarkdown(before, false) : '';
      if (stable.dataset.key !== stableHtml) {
        stable.innerHTML = stableHtml;
        stable.dataset.key = stableHtml;
      }

      this._setHtmlIfChanged(live, ThinkingRenderer.renderStreamingThinkingBlock(after));
    } else {
      if (stable.dataset.key !== '') {
        stable.innerHTML = '';
        stable.dataset.key = '';
      }
      this._setHtmlIfChanged(live, ThinkingRenderer.renderStreamingThinkingBlock(text));
    }
  },

  _renderSingleLine(text, stable, live) {
    if (stable.dataset.key !== '') {
      stable.innerHTML = '';
      stable.dataset.key = '';
    }
    if (text) this._setParagraphText(live, text);
    else this._clearLive(live);
  },

  _renderMultiLine(text, lastNL, stable, live) {
    const completePart = text.slice(0, lastNL + 1);
    const incompletePart = text.slice(lastNL + 1);

    if (stable.dataset.key !== completePart) {
      stable.innerHTML = this.parseMarkdown(completePart, false);
      stable.dataset.key = completePart;
      
      this._scheduleRender(stable);
    }

    if (incompletePart) this._setParagraphText(live, incompletePart);
    else this._clearLive(live);
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
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    this._rafPending = null;
    bubble.innerHTML = this.parseMarkdown(text);
    FormulaRenderer.typeset(bubble);
    this._highlightCodeBlocks(bubble);
  }
};

const RenderModule = {
  init() {
    FormulaRenderer.init();
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    RenderModule.init();
  });
} else {
  RenderModule.init();
}
