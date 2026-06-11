import { useState } from 'react';

export default function ThinkingBlock({ content }) {
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
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="1" /><circle cx="12" cy="12" r="5" />
          <ellipse cx="12" cy="12" rx="10" ry="4" />
          <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
          <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
        </svg>
        思考过程
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
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
