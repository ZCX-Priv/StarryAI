import { useEffect, useMemo, useRef, useState } from 'react';
import { XCircle, RefreshCw, FileText } from 'lucide-react';
import { MarkdownRenderer, ThinkingBlock, extractThinkingBlocks } from '@/render';
import ErrorDetailDialog from '@/components/modals/ErrorDetailDialog';
import type { Message } from '@/types';
import type { ThinkingPart } from '@/render';

interface MessageBubbleProps {
  role: Message['role'];
  content: string;
  status?: Message['status'];
  isStreaming: boolean;
  errorInfo?: string;
  onRegenerate?: () => void;
}

export default function MessageBubble({ role, content, status, isStreaming, errorInfo, onRegenerate }: MessageBubbleProps) {
  const isAI = role === 'assistant';
  const { thinkingParts, contentParts, hasThinking } = useMemo(
    () => isAI ? extractThinkingBlocks(content || '') : { thinkingParts: [] as ThinkingPart[], contentParts: [content], hasThinking: false },
    [content, isAI]
  );

  const [expanded, setExpanded] = useState(false);
  const [needsCollapse, setNeedsCollapse] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
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
              className="msg-collapse-btn"
              onClick={() => setExpanded((prev) => !prev)}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points={expanded ? '18 15 12 9 6 15' : '6 9 12 15 18 9'} />
              </svg>
              {expanded ? '收起' : '查看全部'}
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

  if (status === 'error') {
    const detailText = errorInfo || content.replace(/^⚠\s?/, '') || '未知错误';
    return (
      <div className="msg-row ai">
        <div className="msg-error-content">
          <div className="msg-error-header">
            <XCircle size={18} />
            <span>AI模型响应错误，请稍后重试</span>
          </div>
          <div className="msg-error-actions">
            <button type="button" className="msg-action-btn" onClick={onRegenerate}>
              <RefreshCw size={12} /> 重新生成
            </button>
            <button type="button" className="msg-action-btn" onClick={() => setShowDetail(true)}>
              <FileText size={12} /> 错误信息
            </button>
          </div>
        </div>
        <ErrorDetailDialog visible={showDetail} onClose={() => setShowDetail(false)} errorInfo={detailText} />
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
        {mainContent && <MarkdownRenderer content={mainContent} isStreaming={isStreaming} />}
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
