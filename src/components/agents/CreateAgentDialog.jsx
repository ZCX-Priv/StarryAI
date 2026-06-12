import { useState, useCallback, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { useAgentStore, useUiStore } from '@/status';
import { IDBStore } from '@/services/storage';

const COMMON_EMOJIS = ['🤖', '👨‍💻', '👩‍💻', '🎨', '📝', '📚', '💡', '🔧', '🎯', '🚀', '💼', '🎓', '✨', '🌟', '💪', '🧠', '💻', '🔬', '📊', '🎵', '🎮', '📱', '🌈', '🔥', '⚡', '🦾', '🤝', '💎', '🏆'];

export default function CreateAgentDialog({ visible, onClose }) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🤖');
  const [category, setCategory] = useState('work');
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');
  const [showEmojiGrid, setShowEmojiGrid] = useState(false);
  const showToast = useUiStore(s => s.showToast);

  if (!visible) return null;

  const handleCreate = async () => {
    if (!name || name.length < 1 || name.length > 20) {
      showToast('请输入1-20个字符的智能体名称', 'warning');
      return;
    }
    if (!prompt || prompt.length < 10 || prompt.length > 2000) {
      showToast('请输入10-2000个字符的角色定义', 'warning');
      return;
    }

    const agent = {
      id: 'custom_' + Date.now(),
      name,
      emoji,
      avatar: null,
      prompt,
      description: description || '自定义智能体',
      category,
      isCustom: true,
    };

    try {
      let customAgents = await IDBStore.getAgentConfig('customAgents') || [];
      customAgents.push(agent);
      await IDBStore.setAgentConfig('customAgents', customAgents);

      const agentsConfig = useAgentStore.getState().agentsConfig;
      if (agentsConfig && agentsConfig.agents) {
        agentsConfig.agents.push(agent);
        useAgentStore.setState({ agentsConfig: { ...agentsConfig } });
      }

      showToast(`智能体"${name}"创建成功！`);
      onClose();
    } catch (error) {
      showToast('创建失败，请重试', 'error');
    }
  };

  return (
    <div className="modal-overlay visible" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: '520px' }}>
        <div className="modal-hd">
          <span className="modal-title">创建智能体</span>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">智能体名称 <span className="required">*</span></label>
            <input type="text" className="form-input" placeholder="例如：代码审查助手" maxLength={20} value={name} onChange={e => setName(e.target.value)} />
            <div className="form-hint">最多20个字符</div>
          </div>
          <div className="form-group">
            <label className="form-label">Emoji头像</label>
            <div className="emoji-picker-container">
              <div className="emoji-display" onClick={() => setShowEmojiGrid(!showEmojiGrid)}>{emoji}</div>
              <input type="text" className="emoji-input" placeholder="或输入任意emoji" maxLength={2} value={emoji} onChange={e => setEmoji(e.target.value)} />
            </div>
            {showEmojiGrid && (
              <div className="emoji-grid">
                {COMMON_EMOJIS.map(e => (
                  <button key={e} className={`emoji-item${e === emoji ? ' selected' : ''}`} onClick={() => { setEmoji(e); setShowEmojiGrid(false); }}>{e}</button>
                ))}
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">分类</label>
            <select className="category-select" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="work">工作</option>
              <option value="study">学习</option>
              <option value="create">创作</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">描述</label>
            <input type="text" className="form-input" placeholder="简短描述这个智能体的用途" maxLength={100} value={description} onChange={e => setDescription(e.target.value)} />
            <div className="form-hint">最多100个字符（可选）</div>
          </div>
          <div className="form-group">
            <label className="form-label">角色定义 <span className="required">*</span></label>
            <textarea className="form-textarea" placeholder="定义这个智能体的角色、能力和行为方式..." maxLength={2000} value={prompt} onChange={e => setPrompt(e.target.value)} />
            <div className="form-hint">详细描述智能体的角色和行为方式（10-2000字符）</div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-sm ghost" onClick={onClose}>取消</button>
          <button className="btn-sm primary" onClick={handleCreate}>创建</button>
        </div>
      </div>
    </div>
  );
}
