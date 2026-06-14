import { X } from 'lucide-react';

interface ErrorDetailDialogProps {
  visible: boolean;
  onClose: () => void;
  errorInfo: string;
}

export default function ErrorDetailDialog({ visible, onClose, errorInfo }: ErrorDetailDialogProps) {
  if (!visible) return null;

  return (
    <div className="modal-overlay visible" onClick={(e: React.MouseEvent) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: '480px' }}>
        <div className="modal-hd">
          <span className="modal-title">错误信息</span>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <pre className="error-detail-pre">{errorInfo}</pre>
        </div>
        <div className="modal-footer">
          <button className="btn-sm primary" onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  );
}
