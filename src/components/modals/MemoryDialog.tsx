import { useState } from 'react';
import { X, Pencil, Trash2 } from 'lucide-react';
import { useMemoryStore, useUiStore } from '@/status';
import { editMemoryItem, deleteMemoryItem, clearMemory } from '@/context/memory';

interface MemoryDialogProps {
  visible: boolean;
  onClose: () => void;
}

export default function MemoryDialog({ visible, onClose }: MemoryDialogProps) {
  const memory = useMemoryStore(s => s.memory);

  if (!visible) return null;

  return (
    <div className="modal-overlay visible" onClick={(e: React.MouseEvent) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-hd">
          <span className="modal-title">记忆</span>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          {!memory.length ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text2)' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: 'auto', display: 'block', opacity: 0.3 }}>
                <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
                <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
              </svg>
              <div style={{ marginTop: '14px', fontWeight: 500 }}>尚无保存的记忆。</div>
              <div style={{ fontSize: '13px', marginTop: '5px' }}>AI 在对话过程中自动学习您的偏好。</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '12px' }}>AI 在对话过程中自动学习您的偏好。</div>
              <div className="sec-card">
                {memory.map((m, i) => (
                  <MemoryItem
                    key={i}
                    index={i}
                    text={m}
                    onEdit={(val) => editMemoryItem(i, val)}
                    onDelete={() => deleteMemoryItem(i)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-sm danger" onClick={clearMemory}>全部清除</button>
          <button className="btn-sm ghost" onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  );
}

interface MemoryItemProps {
  index: number;
  text: string;
  onEdit: (value: string) => void;
  onDelete: () => void;
}

function MemoryItem({ index, text, onEdit, onDelete }: MemoryItemProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(text);
  const showToast = useUiStore(s => s.showToast);

  const handleSave = () => {
    onEdit(editValue);
    setEditing(false);
    showToast('记忆已更新', 'success');
  };

  return (
    <div className="mem-item">
      <div className="mem-num">{index + 1}</div>
      {editing ? (
        <div className="mem-text" contentEditable={false}>
          <input
            type="text"
            value={editValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') handleSave(); }}
            autoFocus
            style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--accent2)', borderRadius: 'var(--radius-sm)', padding: '6px 10px', color: 'var(--text)', fontSize: '13.5px', fontFamily: 'var(--font)', outline: 'none' }}
          />
        </div>
      ) : (
        <div className="mem-text" contentEditable={false}>{text}</div>
      )}
      <div className="mem-acts">
        <button className="mem-btn" onClick={() => { setEditValue(text); setEditing(true); }}>
          <Pencil size={12} />
        </button>
        <button className="mem-btn del" onClick={onDelete}>
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}
