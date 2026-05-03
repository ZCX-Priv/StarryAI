/* ─── Renderer ──────────────────────────────────────── */
const Renderer = {
  _blockId: 0,
  _rafId: null,
  _rafPending: null,
  escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  },
  formatText(s) {
    if (!s.trim()) return '';
    s = s.replace(/\n{2,}/g,'</p><p>').replace(/\n/g,'<br>');
    if (!s.match(/^<(h[1-6]|ul|ol|blockquote|hr|p)/)) s = `<p>${s}</p>`;
    return s;
  },
  highlight(code, lang) {
    if (typeof hljs==='undefined'||lang==='text') return Renderer.escHtml(code);
    try { return hljs.highlight(code, {language:lang}).value; }
    catch { return hljs.highlightAuto(code).value; }
  },
  parseMarkdown(md, applyHljs=true) {
    if (!md) return '';
    const blocks = [];
    let s = md.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
      const trimmed = code.trim();
      const langLabel = (lang||'text').toLowerCase();
      const isLong = trimmed.split('\n').length > 8;
      const id = 'cb'+(Renderer._blockId++);
      const collapseBtn = isLong
        ? `<button class="code-block-toggle" onclick="Renderer.toggleBlock(this,event)"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg> 展开</button>`
        : '';
      const highlighted = applyHljs ? Renderer.highlight(trimmed, langLabel) : Renderer.escHtml(trimmed);
      const html = `<div class="code-block-wrap" onclick="Renderer.toggleBlockWrap(this,event)">
<div class="code-block-header"><span class="code-block-lang">${langLabel}</span><div class="code-block-actions">${collapseBtn}<button class="code-copy-btn" onclick="Renderer.copyCode('${id}',event)"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button></div></div>
<div class="${isLong?'code-block-body collapsed':'code-block-body'}"><pre id="${id}"><code class="hljs language-${langLabel}">${highlighted}</code></pre></div>
</div>`;
      blocks.push(html);
      return `\x00BLOCK${blocks.length-1}\x00`;
    });
    s = Renderer.escHtml(s);
    s = s.replace(/`([^`\n]+)`/g,'<code>$1</code>');
    s = s.replace(/^### (.+)$/gm,'<h3>$1</h3>').replace(/^## (.+)$/gm,'<h2>$1</h2>').replace(/^# (.+)$/gm,'<h1>$1</h1>');
    s = s.replace(/\*\*\*(.+?)\*\*\*/g,'<strong><em>$1</em></strong>').replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>');
    s = s.replace(/__(.+?)__/g,'<strong>$1</strong>').replace(/_(.+?)_/g,'<em>$1</em>');
    s = s.replace(/^&gt; (.+)$/gm,'<blockquote>$1</blockquote>');
    s = s.replace(/^---+$/gm,'<hr>');
    s = s.replace(/^(\s*[-*+] .+(\n\s*[-*+] .+)*)/gm, b => {
      const items = b.trim().split('\n').map(l=>`<li>${l.replace(/^\s*[-*+] /,'')}</li>`).join('');
      return `<ul>${items}</ul>`;
    });
    s = s.replace(/^(\s*\d+\. .+(\n\s*\d+\. .+)*)/gm, b => {
      const items = b.trim().split('\n').map(l=>`<li>${l.replace(/^\s*\d+\. /,'')}</li>`).join('');
      return `<ol>${items}</ol>`;
    });
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>');
    const parts = s.split('\x00BLOCK');
    return parts.map((part,i) => {
      if (i===0) return Renderer.formatText(part);
      const nl = part.indexOf('\x00');
      return blocks[parseInt(part.slice(0,nl),10)] + Renderer.formatText(part.slice(nl+1));
    }).join('');
  },
  copyCode(id, e) {
    if (e) e.stopPropagation();
    const pre = document.getElementById(id);
    if (pre) navigator.clipboard.writeText(pre.textContent).then(() => UI.showToast('已复制！'));
  },
  toggleBlock(btn, e) {
    if (e) e.stopPropagation();
    const body = btn.closest('.code-block-wrap').querySelector('.code-block-body');
    const collapsed = body.classList.toggle('collapsed');
    const pts = collapsed ? '6 9 12 15 18 9' : '18 15 12 9 6 15';
    btn.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="${pts}"/></svg> ${collapsed?'展开':'收起'}`;
  },
  toggleBlockWrap(wrap, e) {
    const body = wrap.querySelector('.code-block-body'); if (!body) return;
    const btn = wrap.querySelector('.code-block-toggle');
    const collapsed = body.classList.toggle('collapsed');
    if (btn) {
      const pts = collapsed ? '6 9 12 15 18 9' : '18 15 12 9 6 15';
      btn.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="${pts}"/></svg> ${collapsed?'展开':'收起'}`;
    }
  },
  _zones(bubble) {
    let stable = bubble.querySelector(':scope > .sb-stable');
    let live   = bubble.querySelector(':scope > .sb-live');
    if (!stable) {
      stable = document.createElement('div'); stable.className='sb-stable';
      live   = document.createElement('div'); live.className='sb-live';
      bubble.innerHTML=''; bubble.appendChild(stable); bubble.appendChild(live);
    }
    return {stable, live};
  },
  scheduleStream(text, bubble) {
    Renderer._rafPending = {text, bubble};
    if (!Renderer._rafId) {
      Renderer._rafId = requestAnimationFrame(() => {
        Renderer._rafId = null;
        if (Renderer._rafPending) {
          Renderer.renderStream(Renderer._rafPending.text, Renderer._rafPending.bubble);
          Renderer._rafPending = null;
          UI.maybeScroll();
        }
      });
    }
  },
  renderStream(text, bubble) {
    const ticks = (text.match(/```/g)||[]).length;
    const {stable, live} = Renderer._zones(bubble);
    if (ticks % 2 === 1) {
      let openPos=-1;
      for (let i=0;i<=text.length-3;i++) {
        if (text[i]==='`'&&text[i+1]==='`'&&text[i+2]==='`') { openPos=i; i+=2; }
      }
      const before = text.slice(0, openPos);
      const afterTick = text.slice(openPos+3);
      const nlPos = afterTick.indexOf('\n');
      const lang = nlPos>-1 ? afterTick.slice(0,nlPos).trim() : afterTick.trim();
      const codeContent = nlPos>-1 ? afterTick.slice(nlPos+1) : '';
      const stableHtml = before ? Renderer.parseMarkdown(before, false) : '';
      if (stable.dataset.key !== stableHtml) { stable.innerHTML=stableHtml; stable.dataset.key=stableHtml; }
      live.innerHTML = `<div class="code-block-wrap"><div class="code-block-header"><span class="code-block-lang">${lang||'code'}</span></div><div class="code-block-body"><pre><code class="hljs">${Renderer.escHtml(codeContent)}</code></pre></div></div>`;
      return;
    }
    const lastNL = text.lastIndexOf('\n');
    if (lastNL < 0) {
      if (stable.dataset.key!=='') { stable.innerHTML=''; stable.dataset.key=''; }
      live.innerHTML=`<p>${Renderer.escHtml(text)}</p>`;
      return;
    }
    const completePart = text.slice(0, lastNL+1);
    if (stable.dataset.key !== completePart) {
      stable.innerHTML = Renderer.parseMarkdown(completePart, false);
      stable.dataset.key = completePart;
    }
    live.innerHTML = text.slice(lastNL+1)
      ? `<p>${Renderer.escHtml(text.slice(lastNL+1))}</p>`
      : '';
  }
};
