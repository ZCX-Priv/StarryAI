import { X } from 'lucide-react';
import { useUiStore } from '@/status';
import useChats from '@/hooks/useChats';

export default function ConfirmDeleteDialog({ visible, onClose, chatId }) {
  const { deleteChat } = useChats();
  const showToast = useUiStore(s => s.showToast);

  if (!visible) return null;

  const handleDelete = async () => {
    await deleteChat(chatId);
    showToast('对话已删除', 'info');
    onClose();
  };

  return (
    <div className="modal-overlay visible" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: '360px' }}>
        <div className="modal-hd">
          <span className="modal-title">确认删除</span>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <p style={{ textAlign: 'center', color: 'var(--text2)', fontSize: '14px', margin: '8px 0' }}>
            确定要删除这个对话吗？此操作无法撤销。
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn-sm ghost" onClick={onClose}>取消</button>
          <button className="btn-sm danger" onClick={handleDelete}>删除</button>
        </div>
      </div>
    </div>
  );
}
