import { useState, useCallback } from 'react';
import { Copy, Check, Eye } from 'lucide-react';
import HtmlPreviewDialog from '@/components/modals/HtmlPreviewDialog';

const LANG_NAMES: Record<string, string> = {
  js: 'JavaScript',
  javascript: 'JavaScript',
  ts: 'TypeScript',
  typescript: 'TypeScript',
  py: 'Python',
  python: 'Python',
  rb: 'Ruby',
  ruby: 'Ruby',
  java: 'Java',
  cpp: 'C++',
  c: 'C',
  cs: 'C#',
  go: 'Go',
  rust: 'Rust',
  php: 'PHP',
  swift: 'Swift',
  kt: 'Kotlin',
  kotlin: 'Kotlin',
  sql: 'SQL',
  sh: 'Shell',
  bash: 'Bash',
  zsh: 'Zsh',
  html: 'HTML',
  css: 'CSS',
  scss: 'SCSS',
  json: 'JSON',
  yaml: 'YAML',
  yml: 'YAML',
  xml: 'XML',
  md: 'Markdown',
  dockerfile: 'Dockerfile',
  makefile: 'Makefile',
  toml: 'TOML',
  ini: 'INI',
  diff: 'Diff',
  plaintext: 'Text',
};

function getLangDisplay(lang: string): string {
  if (!lang) return '';
  const lower = lang.toLowerCase();
  if (LANG_NAMES[lower]) return LANG_NAMES[lower];
  return lang.charAt(0).toUpperCase() + lang.slice(1);
}

interface CodeBlockProps {
  language: string;
  code: string;
  children: React.ReactNode;
}

export default function CodeBlock({ language, code, children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  const isHtml = language.toLowerCase() === 'html';
  const langDisplay = getLangDisplay(language);

  return (
    <div className="code-block">
      <div className="code-block-header">
        <span className="code-block-lang">{langDisplay}</span>
        <div className="code-block-actions">
          {isHtml && (
            <button
              type="button"
              className="code-block-btn"
              onClick={() => setShowPreview(true)}
              title="预览"
            >
              <Eye size={14} />
            </button>
          )}
          <button
            type="button"
            className="code-block-btn"
            onClick={handleCopy}
            title={copied ? '已复制' : '复制'}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      </div>
      <div className="code-block-content">
        {children}
      </div>
      {showPreview && (
        <HtmlPreviewDialog
          visible={showPreview}
          onClose={() => setShowPreview(false)}
          data={{ code, lang: language }}
        />
      )}
    </div>
  );
}
