import { useState } from 'react';

interface ThinkingBlockProps {
  content: string;
}

export default function ThinkingBlock({ content }: ThinkingBlockProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ marginBottom: '8px' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'var(--bg3)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', padding: '6px 12px',
          color: 'var(--text3)', fontSize: '12px', cursor: 'pointer',
          fontFamily: 'var(--font)', transition: 'all 0.15s',
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: 'block' }}>
          <circle cx="12" cy="12" r="1" />
          <path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z" />
          <path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z" />
        </svg>
        思考过程
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, display: 'block', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {expanded && (
        <div style={{
          marginTop: '6px', padding: '10px 14px',
          background: 'var(--bg3)', borderRadius: 'var(--radius-sm)',
          fontSize: '13px', color: 'var(--text2)', lineHeight: '1.6',
          whiteSpace: 'pre-wrap', maxHeight: '300px', overflowY: 'auto',
        }}>
          {content}
        </div>
      )}
    </div>
  );
}
