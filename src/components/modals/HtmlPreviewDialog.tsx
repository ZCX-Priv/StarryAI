import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface HtmlPreviewData {
  code?: string;
  lang?: string;
}

interface HtmlPreviewDialogProps {
  visible: boolean;
  onClose: () => void;
  data?: HtmlPreviewData;
}

export default function HtmlPreviewDialog({ visible, onClose, data }: HtmlPreviewDialogProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (visible && iframeRef.current && data) {
      iframeRef.current.srcdoc = data.code || '<!doctype html><html><body></body></html>';
    }
  }, [visible, data]);

  if (!visible) return null;

  const title = data?.lang ? `${String(data.lang).toUpperCase()} 预览` : 'HTML 预览';

  return (
    <div className="modal-overlay visible" onClick={(e: React.MouseEvent) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal preview-modal" style={{ maxWidth: '960px' }}>
        <div className="modal-hd">
          <span className="modal-title">{title}</span>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body preview-modal-body">
          <iframe
            ref={iframeRef}
            className="code-preview-frame"
            sandbox="allow-scripts allow-forms allow-modals"
          />
        </div>
        <div className="modal-footer">
          <button className="btn-sm ghost" onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  );
}
