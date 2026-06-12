import { useState, useEffect } from 'react';
import { RefreshCw, Copy } from 'lucide-react';
import { useChatStore, useUiStore } from '@/status';

export default function MessageActions({ onRegenerate }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(t);
  }, []);

  const handleCopy = async () => {
    const chat = useChatStore.getState().chats.find(c => c.id === useChatStore.getState().activeChatId);
    const last = [...(chat?.messages || [])].reverse().find(m => m.role === 'assistant');
    if (!last) return;
    try {
      await navigator.clipboard.writeText(last.content);
      useUiStore.getState().showToast('已复制！');
    } catch {
      useUiStore.getState().showToast('复制失败', 'error');
    }
  };

  return (
    <div className={`msg-actions${visible ? ' visible' : ''}`}>
      <button className="msg-action-btn" onClick={onRegenerate}>
        <RefreshCw size={12} /> 重新生成
      </button>
      <button className="msg-action-btn" onClick={handleCopy}>
        <Copy size={12} /> 复制
      </button>
    </div>
  );
}
