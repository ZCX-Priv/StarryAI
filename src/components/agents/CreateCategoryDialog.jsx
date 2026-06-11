import { useState } from 'react';
import { X } from 'lucide-react';
import useAppStore from '@/store/useAppStore';
import { IDBStore } from '@/services/storage';

export default function CreateCategoryDialog({ visible, onClose }) {
  const [name, setName] = useState('');
  const showToast = useAppStore(s => s.showToast);

  if (!visible) return null;

  const handleCreate = async () => {
    if (!name || name.length < 1 || name.length > 10) {
      showToast('请输入1-10个字符的分类名称');
      return;
    }

    const agentsConfig = useAppStore.getState().agentsConfig;
    const existingNames = agentsConfig?.categories?.map(c => c.name) || [];
    if (existingNames.includes(name)) {
      showToast('该分类名称已存在');
      return;
    }

    const category = {
      id: 'custom_category_' + Date.now(),
      name,
      isCustom: true,
    };

    try {
      let customCategories = await IDBStore.getAgentConfig('customCategories') || [];
      customCategories.push(category);
      await IDBStore.setAgentConfig('customCategories', customCategories);

      if (agentsConfig && agentsConfig.categories) {
        const insertIndex = agentsConfig.categories.findIndex(c => c.id === 'mine');
        if (insertIndex > 0) {
          agentsConfig.categories.splice(insertIndex, 0, category);
        } else {
          agentsConfig.categories.push(category);
        }
        useAppStore.setState({ agentsConfig: { ...agentsConfig } });
      }

      showToast(`分类"${name}"创建成功！`);
      setName('');
      onClose();
    } catch (error) {
      showToast('创建失败，请重试');
    }
  };

  return (
    <div className="modal-overlay visible" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: '400px' }}>
        <div className="modal-hd">
          <span className="modal-title">创建分类</span>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">分类名称 <span className="required">*</span></label>
            <input
              type="text"
              className="form-input"
              placeholder="输入分类名称..."
              maxLength={10}
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
            />
            <div className="form-hint">最多10个字符</div>
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
