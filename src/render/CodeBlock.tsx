import { useState, useCallback, type ReactNode } from 'react';
import { Copy, Check, Eye, EyeOff } from 'lucide-react';
import MermaidDiagram from './MermaidDiagram';

interface CopyButtonProps {
  text: string;
}

function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: ignore
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="code-block-btn"
      title="复制代码"
      type="button"
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-400" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </button>
  );
}

interface HtmlPreviewProps {
  htmlCode: string;
}

function HtmlPreview({ htmlCode }: HtmlPreviewProps) {
  const [show, setShow] = useState(false);

  return (
    <>
      <button
        onClick={() => setShow((v) => !v)}
        className="code-block-btn"
        title={show ? '关闭预览' : '预览 HTML'}
        type="button"
      >
        {show ? (
          <EyeOff className="w-4 h-4" />
        ) : (
          <Eye className="w-4 h-4" />
        )}
      </button>
      {show && (
        <div className="html-preview-area">
          <iframe
            srcDoc={htmlCode}
            className="html-preview-iframe"
            sandbox="allow-scripts"
            title="HTML 预览"
          />
        </div>
      )}
    </>
  );
}

function extractCodeInfo(children: ReactNode): {
  language: string | null;
  codeString: string;
  codeElement: ReactNode;
} {
  if (!children || typeof children !== 'object' || !('props' in children)) {
    return { language: null, codeString: '', codeElement: children };
  }
  const child = children as { props?: { className?: string; children?: ReactNode } };
  const className = child.props?.className || '';
  const match = /language-(\w+)/.exec(className);
  const language = match ? match[1] : null;
  const codeString = String(child.props?.children ?? '').replace(/\n$/, '');
  return { language, codeString, codeElement: children };
}

interface CodeBlockProps {
  children?: ReactNode;
  node?: unknown;
}

export default function CodeBlock({ children }: CodeBlockProps) {
  if (!children) return null;

  const { language, codeString, codeElement } = extractCodeInfo(children);

  // Mermaid 代码块
  if (language === 'mermaid') {
    return <MermaidDiagram chart={codeString} />;
  }

  // 无语言标识的 pre（非代码块，直接透传）
  if (!language) {
    return <pre>{children}</pre>;
  }

  const isHtml = language === 'html' || language === 'htm';

  return (
    <div className="code-block-wrapper">
      <div className="code-block-header">
        <span className="code-block-lang">{language}</span>
        <div className="code-block-actions">
          {isHtml && <HtmlPreview htmlCode={codeString} />}
          <CopyButton text={codeString} />
        </div>
      </div>
      <pre className="code-block-pre">{codeElement}</pre>
    </div>
  );
}
