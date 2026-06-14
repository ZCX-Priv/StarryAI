import { useState } from 'react';
import { useChatStore, useStreamStore } from '@/status';

export default function StreamStatus() {
  const activeChatId = useChatStore(s => s.activeChatId);
  const streamingChatIds = useStreamStore(s => s.streamingChatIds);
  const [statusText] = useState('正在生成回复…');
  const [isCodeMode] = useState(false);

  if (activeChatId === null || !streamingChatIds.has(activeChatId)) return null;

  return (
    <div id="stream-status" className={`visible${isCodeMode ? ' code-mode' : ''}`}>
      <div className="stream-dot" />
      <span id="stream-status-text">{statusText}</span>
    </div>
  );
}
