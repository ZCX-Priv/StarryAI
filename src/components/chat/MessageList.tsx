import { Fragment, useMemo } from 'react';
import { useChatStore, useStreamStore } from '@/status';
import MessageBubble from './MessageBubble';
import MessageActions from './MessageActions';
import EmptyState from './EmptyState';

interface MessageListProps {
  onRegenerate: () => void;
}

export default function MessageList({ onRegenerate }: MessageListProps) {
  const activeChatId = useChatStore(s => s.activeChatId);
  const chats = useChatStore(s => s.chats);
  const streamingChatIds = useStreamStore(s => s.streamingChatIds);
  const isStreamingThisChat = activeChatId !== null && streamingChatIds.has(activeChatId);

  const activeChat = useMemo(
    () => chats.find(c => c.id === activeChatId),
    [chats, activeChatId]
  );

  const messages = activeChat?.messages || [];

  if (!messages.length) {
    return (
      <div className="messages-inner is-empty">
        <EmptyState />
      </div>
    );
  }

  const lastAiIndex = [...messages].reverse().findIndex(m => m.role === 'assistant');
  const lastAiMsgIndex = lastAiIndex >= 0 ? messages.length - 1 - lastAiIndex : -1;
  const lastAiMsg = lastAiMsgIndex >= 0 ? messages[lastAiMsgIndex] : null;

  return (
    <div className="messages-inner">
      {messages.map((msg, i) => (
        <Fragment key={msg.id}>
          <MessageBubble
            role={msg.role}
            content={msg.content}
            status={msg.status}
            isStreaming={isStreamingThisChat && i === messages.length - 1 && msg.role === 'assistant'}
            errorInfo={msg.errorInfo}
            onRegenerate={msg.role === 'assistant' && msg.status === 'error' ? onRegenerate : undefined}
          />
          {msg.role === 'assistant' && msg.stopped && (
            <div className="msg-stopped-hint">
              <span className="stopped-dot" />
              手动终止输出
            </div>
          )}
        </Fragment>
      ))}
      {lastAiMsgIndex >= 0 && !isStreamingThisChat && lastAiMsg?.status !== 'error' && (
        <MessageActions onRegenerate={onRegenerate} />
      )}
    </div>
  );
}
