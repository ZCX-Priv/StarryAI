import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'strict',
  fontFamily: 'inherit',
});

interface MermaidBlockProps {
  code: string;
}

export default function MermaidBlock({ code }: MermaidBlockProps) {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderCountRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const id = `mermaid-${++renderCountRef.current}-${Date.now()}`;

    mermaid
      .render(id, code)
      .then(({ svg: renderedSvg }) => {
        if (!cancelled) {
          setSvg(renderedSvg);
          setError(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [code]);

  if (error) {
    return (
      <div className="mermaid-block mermaid-block-error">
        <div className="mermaid-error-hint">图表渲染失败，原始代码如下：</div>
        <pre><code>{code}</code></pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="mermaid-block mermaid-block-loading">
        <div className="mermaid-loading-hint">图表渲染中...</div>
      </div>
    );
  }

  return (
    <div className="mermaid-block" ref={containerRef}>
      <div dangerouslySetInnerHTML={{ __html: svg }} />
    </div>
  );
}
