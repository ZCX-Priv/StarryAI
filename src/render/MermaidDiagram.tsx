import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import useThemeStore from '@/status/themeStore';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'strict',
});

interface MermaidDiagramProps {
  chart: string;
}

export default function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');
  const idRef = useRef(`mermaid-${crypto.randomUUID()}`);
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    const isDark =
      theme === 'dark' ||
      (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    mermaid.initialize({
      startOnLoad: false,
      theme: isDark ? 'dark' : 'default',
      securityLevel: 'strict',
    });
  }, [theme]);

  useEffect(() => {
    let cancelled = false;
    const renderChart = async () => {
      try {
        const id = `m-${crypto.randomUUID().slice(0, 8)}`;
        idRef.current = id;
        const { svg: renderedSvg } = await mermaid.render(id, chart);
        if (!cancelled) {
          setSvg(renderedSvg);
          setError('');
        }
      } catch (err) {
        if (!cancelled) {
          setError(String(err));
          const el = document.getElementById('d' + idRef.current);
          if (el) el.remove();
        }
      }
    };
    renderChart();
    return () => { cancelled = true; };
  }, [chart, theme]);

  if (error) {
    return (
      <div className="mermaid-error">
        Mermaid 渲染失败
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="mermaid-loading">
        渲染中...
      </div>
    );
  }

  return (
    <div
      className="mermaid-container"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
