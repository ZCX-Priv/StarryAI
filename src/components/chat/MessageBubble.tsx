import { useEffect, useMemo, useRef, useState } from 'react';
import { MarkdownRenderer, ThinkingBlock, extractThinkingBlocks } from '@/render';
import type { Message } from '@/types';
import type { ThinkingPart } from '@/render';

interface MessageBubbleProps {
  role: Message['role'];
  content: string;
  status?: Message['status'];
  isStreaming: boolean;
}

export default function MessageBubble({ role, content, status, isStreaming }: MessageBubbleProps) {
  const isAI = role === 'assistant';
  const { thinkingParts, contentParts, hasThinking } = useMemo(
    () => isAI ? extractThinkingBlocks(content || '') : { thinkingParts: [] as ThinkingPart[], contentParts: [content], hasThinking: false },
    [content, isAI]
  );

  const [expanded, setExpanded] = useState(false);
  const [needsCollapse, setNeedsCollapse] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAI) return;
    const el = textRef.current;
    if (!el) return;
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
    if (!Number.isNaN(lineHeight)) {
      const shouldCollapse = el.scrollHeight > lineHeight * 3 + 1;
      setNeedsCollapse(shouldCollapse);
      if (!shouldCollapse) setExpanded(false);
    }
  }, [content, isAI]);

  if (!isAI) {
    return (
      <div className="msg-row user">
        <div className="msg-bubble">
          <div ref={textRef} className={needsCollapse && !expanded ? 'collapsed' : ''}>
            {content}
          </div>
          {needsCollapse && (
            <button
              type="button"
              className="msg-expand-btn"
              onClick={() => setExpanded((prev) => !prev)}
            >
              {expanded ? '收起内容' : '展开内容'}
            </button>
          )}
        </div>
        <div className="msg-avatar">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
      </div>
    );
  }

  const mainContent = contentParts.join('\n');

  return (
    <div className="msg-row ai">
      <div className={`ai-msg-content${isStreaming ? ' streaming' : ''}`}>
        {hasThinking && thinkingParts.map((part, i) => (
          <ThinkingBlock key={`think-${i}-${part.content.slice(0, 8)}`} content={part.content} isComplete={part.isComplete} />
        ))}
        {isStreaming && !mainContent && (
          <div className="typing-indicator">
            <div className="td"></div>
            <div className="td"></div>
            <div className="td"></div>
          </div>
        )}
        {mainContent && <MarkdownRenderer content={mainContent} />}
        {isStreaming && mainContent && <span className="streaming-cursor" />}
        {status === 'interrupted' && (
          <div className="msg-interrupted-hint">
            <span className="interrupted-dot" />
            生成被中断，内容可能不完整
          </div>
        )}
      </div>
    </div>
  );
}
