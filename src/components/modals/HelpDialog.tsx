import { X, Brain, Sun, Settings } from 'lucide-react';
import type { ReactNode } from 'react';

interface HelpSection {
  title: string;
  icon: ReactNode;
  text: string;
}

const SECTIONS: HelpSection[] = [
  {
    title: '记忆功能介绍',
    icon: <Brain size={15} />,
    text: 'AI 会在对话中自动学习关于您的有用信息，包括姓名、偏好、沟通风格和兴趣。这些记忆保存在本地，用于个性化回复。您可以通过顶栏的大脑图标或侧栏"记忆"查看、编辑或删除任何记忆。',
  },
  {
    title: '切换模型',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18M3 9h6M3 15h6" /></svg>,
    text: '您可以通过顶栏的模型选择器或在设置→外观→模型中切换 AI 模型。"fast"模型速度更快，大型模型生成的回复更详细。',
  },
  {
    title: '自定义外观',
    icon: <Sun size={15} />,
    text: '在设置→外观中，您可以切换主题（自动、深色或浅色），并开启或关闭聊天背景的蜂巢装饰画布。自动主题跟随系统设置。',
  },
  {
    title: '管理密钥',
    icon: <Settings size={15} />,
    text: '公钥（pk_...）是通过 Pollinations.ai 使用 AI 的必要凭证。请访问 enter.pollinations.ai 获取。在设置→密钥中，您可以添加多个密钥、激活不同密钥或删除旧密钥。',
  },
];

interface HelpDialogProps {
  visible: boolean;
  onClose: () => void;
}

export default function HelpDialog({ visible, onClose }: HelpDialogProps) {
  if (!visible) return null;

  return (
    <div className="modal-overlay visible" onClick={(e: React.MouseEvent) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-hd">
          <span className="modal-title">帮助中心</span>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          {SECTIONS.map((s, i) => (
            <div key={i}>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '8px' }}>
                  <div style={{
                    width: 32, height: 32, background: 'var(--accent-glow)', borderRadius: 9,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    color: 'var(--accent2)',
                  }}>
                    {s.icon}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>{s.title}</div>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.7, paddingLeft: '41px' }}>{s.text}</div>
              </div>
              {i < SECTIONS.length - 1 && <div style={{ height: 1, background: 'var(--border)', margin: '4px 0 20px' }} />}
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <button className="btn-sm ghost" onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  );
}
