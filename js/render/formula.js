/* ─── Formula Renderer (MathJax) ──────────────────────── */
const FormulaRenderer = {
  _initialized: false,
  _pendingTypeset: null,
  _formulaId: 0,

  init() {
    if (this._initialized) return;
    this._initialized = true;

    if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
      return;
    }

    if (!document.querySelector('script[src*="mathjax"]')) {
      const config = document.createElement('script');
      config.textContent = `
window.MathJax = {
  tex: {
    inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
    displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
    processEscapes: true,
    packages: {'[+]': ['mhchem']}
  },
  svg: { fontCache: 'global' },
  startup: {
    pageReady: () => {
      return MathJax.startup.defaultPageReady();
    }
  }
};`;
      document.head.appendChild(config);

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js';
      script.async = true;
      document.head.appendChild(script);
    }
  },

  extractFormulas(text) {
    const formulas = [];
    const placeholder = '\x00FORMULA';
    let index = 0;

    let result = text;

    result = result.replace(/\$\$([\s\S]+?)\$\$/g, (_, formula) => {
      const formulaIndex = index++;
      formulas.push({
        content: formula.trim(),
        display: true,
        index: formulaIndex
      });
      return `${placeholder}${formulaIndex}\x00`;
    });

    result = result.replace(/\$([^\$\n]+?)\$/g, (_, formula) => {
      const formulaIndex = index++;
      formulas.push({
        content: formula.trim(),
        display: false,
        index: formulaIndex
      });
      return `${placeholder}${formulaIndex}\x00`;
    });

    return { text: result, formulas, placeholder };
  },

  renderFormula(formula, display = false) {
    if (display) {
      return `<div class="formula-display">$$${formula}$$</div>`;
    }
    return `<span class="formula-inline">$${formula}$</span>`;
  },

  restoreFormulas(text, formulas, placeholder) {
    const parts = text.split(placeholder);
    return parts.map((part, i) => {
      if (i === 0) return part;
      const nlPos = part.indexOf('\x00');
      const formulaIndex = parseInt(part.slice(0, nlPos), 10);
      const formula = formulas[formulaIndex];
      const rest = part.slice(nlPos + 1);
      const formulaHtml = formula
        ? this.renderFormula(formula.content, formula.display)
        : '';
      return formulaHtml + rest;
    }).join('');
  },

  async typeset(element) {
    if (typeof MathJax === 'undefined' || !MathJax.typesetPromise) {
      return;
    }

    if (this._pendingTypeset) {
      clearTimeout(this._pendingTypeset);
    }

    this._pendingTypeset = setTimeout(async () => {
      try {
        await MathJax.typesetPromise(element ? [element] : undefined);
      } catch (e) {
        console.warn('MathJax typeset error:', e);
      }
      this._pendingTypeset = null;
    }, 50);
  },

  hasUnclosedFormula(text) {
    const dollarCount = (text.match(/\$/g) || []).length;
    return dollarCount % 2 !== 0;
  },

  findOpenFormulaPosition(text) {
    let pos = -1;
    let inCodeBlock = false;
    
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '`' && text[i + 1] === '`' && text[i + 2] === '`') {
        inCodeBlock = !inCodeBlock;
        i += 2;
        continue;
      }
      
      if (!inCodeBlock && text[i] === '$') {
        pos = i;
      }
    }
    
    return pos;
  }
};
