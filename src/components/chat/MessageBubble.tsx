import { useMemo } from 'react';
import { MarkdownRenderer, ThinkingBlock, extractThinkingBlocks } from '@/render';
import type { Message } from '@/types';

interface MessageBubbleProps {
  role: Message['role'];
  content: string;
  isStreaming: boolean;
}

export default function MessageBubble({ role, content, isStreaming }: MessageBubbleProps) {
  const isAI = role === 'assistant';
  const { thinkingParts, contentParts, hasThinking } = useMemo(
    () => isAI ? extractThinkingBlocks(content || '') : { thinkingParts: [] as string[], contentParts: [content], hasThinking: false },
    [content, isAI]
  );

  if (!isAI) {
    return (
      <div className="msg-row user">
        <div className="msg-bubble">{content}</div>
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
          <ThinkingBlock key={`think-${i}-${part.slice(0, 8)}`} content={part} />
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
      </div>
    </div>
  );
}
