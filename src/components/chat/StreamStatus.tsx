import { useState } from 'react';
import { useChatStore, useStreamStore } from '@/status';

export default function StreamStatus() {
  const streamingChatId = useStreamStore(s => s.streamingChatId);
  const activeChatId = useChatStore(s => s.activeChatId);
  const [statusText] = useState('正在生成回复…');
  const [isCodeMode] = useState(false);

  if (streamingChatId === null || streamingChatId !== activeChatId) return null;

  return (
    <div id="stream-status" className={`visible${isCodeMode ? ' code-mode' : ''}`}>
      <div className="stream-dot" />
      <span id="stream-status-text">{statusText}</span>
    </div>
  );
}
