import { useRef, useEffect } from 'react';

interface MathJaxNodeProps {
  value: string;
  display?: boolean;
}

export default function MathJaxNode({ value, display = false }: MathJaxNodeProps) {
  const ref = useRef<HTMLDivElement | HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    let cancelled = false;
    const el = ref.current;

    const render = async () => {
      // 等待 MathJax 加载完成
      while (!cancelled && !(window as any).MathJax?.startup?.promise) {
        await new Promise((r) => setTimeout(r, 100));
      }
      if (cancelled || !el) return;

      const mj = (window as any).MathJax;
      await mj.startup.promise;
      if (cancelled || !el) return;

      // 设置带分隔符的文本
      el.textContent = display ? `\\[${value}\\]` : `\\(${value}\\)`;

      // 仅渲染当前元素
      await mj.typesetPromise([el]);
    };

    render();

    return () => {
      cancelled = true;
      const mj = (window as any).MathJax;
      if (mj?.typesetClear && el) {
        mj.typesetClear([el]);
      }
    };
  }, [value, display]);

  if (display) {
    return (
      <div
        ref={ref as React.RefObject<HTMLDivElement>}
        style={{ display: 'block', textAlign: 'center', margin: '.75em 0' }}
      />
    );
  }

  return <span ref={ref as React.RefObject<HTMLSpanElement>} />;
}
