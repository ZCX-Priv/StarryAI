import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useChatStore, useUiStore } from '@/status';
import useChats from '@/hooks/useChats';

export default function RenameDialog({ visible, onClose, chatId }) {
  const chats = useChatStore(s => s.chats);
  const { renameChat } = useChats();
  const showToast = useUiStore(s => s.showToast);
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (visible && chatId) {
      const chat = chats.find(c => c.id === chatId);
      setValue(chat?.title === '新对话' ? '' : (chat?.title || ''));
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [visible, chatId, chats]);

  if (!visible) return null;

  const handleRename = async () => {
    const newTitle = value.trim() || '新对话';
    await renameChat(chatId, newTitle);
    showToast('名称已保存', 'success');
    onClose();
  };

  return (
    <div className="modal-overlay visible" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: '400px' }}>
        <div className="modal-hd">
          <span className="modal-title">编辑对话名称</span>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <input
            ref={inputRef}
            type="text"
            className="form-input"
            placeholder="输入对话名称..."
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleRename(); }}
          />
        </div>
        <div className="modal-footer">
          <button className="btn-sm ghost" onClick={onClose}>取消</button>
          <button className="btn-sm primary" onClick={handleRename}>保存</button>
        </div>
      </div>
    </div>
  );
}
