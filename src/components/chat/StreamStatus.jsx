import { useState } from 'react';
import useAppStore from '@/store/useAppStore';

export default function StreamStatus() {
  const isStreaming = useAppStore(s => s.isStreaming);
  const [statusText] = useState('正在生成回复…');
  const [isCodeMode] = useState(false);

  if (!isStreaming) return null;

  return (
    <div id="stream-status" className={`visible${isCodeMode ? ' code-mode' : ''}`}>
      <div className="stream-dot" />
      <span id="stream-status-text">{statusText}</span>
    </div>
  );
}
