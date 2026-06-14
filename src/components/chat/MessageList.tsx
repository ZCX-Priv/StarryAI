import { useMemo } from 'react';
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

  return (
    <div className="messages-inner">
      {messages.map((msg, i) => (
        <MessageBubble
          key={msg.id}
          role={msg.role}
          content={msg.content}
          isStreaming={isStreamingThisChat && i === messages.length - 1 && msg.role === 'assistant'}
        />
      ))}
      {isStreamingThisChat && (
        <div className="msg-row ai">
          <div className="ai-msg-content">
            <div className="typing-indicator">
              <div className="td"></div>
              <div className="td"></div>
              <div className="td"></div>
            </div>
          </div>
        </div>
      )}
      {lastAiMsgIndex >= 0 && !isStreamingThisChat && (
        <MessageActions onRegenerate={onRegenerate} />
      )}
    </div>
  );
}
