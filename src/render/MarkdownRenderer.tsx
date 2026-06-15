import { type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeMathjax from 'rehype-mathjax/browser';
import CodeBlock from './CodeBlock';
import MermaidBlock from './MermaidBlock';
import 'highlight.js/styles/atom-one-dark.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

function extractTextFromChildren(children: ReactNode): string {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (!children) return '';
  if (Array.isArray(children)) return children.map(extractTextFromChildren).join('');
  if (typeof children === 'object' && 'props' in children) {
    return extractTextFromChildren((children as { props: { children?: ReactNode } }).props.children);
  }
  return '';
}

export default function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={['markdown-body', className].filter(Boolean).join(' ')}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[
          rehypeHighlight,
          [rehypeMathjax, {
            tex: {
              packages: { '[+]': ['mhchem'] },
            },
          }],
        ]}
        components={{
          pre({ children }) {
            const child = children as React.ReactElement<{
              className?: string;
              children?: ReactNode;
            }> | null;

            if (!child || typeof child === 'string') {
              return <pre>{children}</pre>;
            }

            const codeClassName = child.props?.className || '';
            const match = /language-(\w+)/.exec(codeClassName);
            const lang = match ? match[1] : '';
            const codeText = extractTextFromChildren(child.props?.children).replace(/\n$/, '');

            if (lang === 'mermaid') {
              return <MermaidBlock code={codeText} />;
            }

            if (lang) {
              return (
                <CodeBlock language={lang} code={codeText}>
                  {children}
                </CodeBlock>
              );
            }

            return <pre className="code-block-no-lang">{children}</pre>;
          },
          code({ className, children, ...props }) {
            const isInline = !className;
            if (isInline) {
              return <code className={className} {...props}>{children}</code>;
            }
            return <code className={className} {...props}>{children}</code>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
