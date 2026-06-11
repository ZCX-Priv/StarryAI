import { useState, useCallback } from 'react';
import { X, Trash2, Monitor, Sun, Moon } from 'lucide-react';
import useAppStore from '@/store/useAppStore';
import useTheme from '@/hooks/useTheme';
import { IDBStore } from '@/services/storage';
import { API } from '@/services/api';
import { formatContextLength } from '@/lib/config';

export default function SettingsDialog({ visible, onClose }) {
  const settingsTab = useAppStore(s => s.settingsTab);
  const setSettingsTab = useAppStore(s => s.setSettingsTab);
  const theme = useAppStore(s => s.theme);
  const honeycomb = useAppStore(s => s.honeycomb);
  const setHoneycomb = useAppStore(s => s.setHoneycomb);
  const model = useAppStore(s => s.model);
  const setModel = useAppStore(s => s.setModel);
  const models = useAppStore(s => s.models);
  const setModels = useAppStore(s => s.setModels);
  const temperature = useAppStore(s => s.temperature);
  const setTemperature = useAppStore(s => s.setTemperature);
  const topP = useAppStore(s => s.topP);
  const setTopP = useAppStore(s => s.setTopP);
  const contextLength = useAppStore(s => s.contextLength);
  const setContextLength = useAppStore(s => s.setContextLength);
  const keys = useAppStore(s => s.keys);
  const activeKey = useAppStore(s => s.activeKey);
  const addKey = useAppStore(s => s.addKey);
  const deleteKey = useAppStore(s => s.deleteKey);
  const activateKey = useAppStore(s => s.activateKey);
  const showToast = useAppStore(s => s.showToast);
  const { apply } = useTheme();

  const [newKey, setNewKey] = useState('');

  if (!visible) return null;

  const handleAddKey = () => {
    const k = newKey.trim();
    if (!k) return;
    addKey(k);
    setNewKey('');
    showToast('密钥已保存！');
  };

  const handleActivateKey = (k) => {
    activateKey(k);
    showToast('密钥已保存！');
  };

  const handleDeleteKey = (k) => {
    deleteKey(k);
    showToast('密钥已删除');
  };

  const handleModelChange = (id) => {
    setModel(id);
  };

  const renderAppearance = () => (
    <>
      <div className="sec-title">主题</div>
      <div className="sec-card" style={{ marginBottom: '20px' }}>
        {['auto', 'light', 'dark'].map(th => (
          <div
            key={th}
            className="sec-row"
            style={{ cursor: 'pointer' }}
            onClick={() => { apply(th); }}
          >
            <div className="sec-row-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {th === 'auto' ? <Monitor size={14} /> : th === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
              {th === 'auto' ? '自动' : th === 'dark' ? '深色' : '浅色'}
            </div>
            {theme === th && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent2)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
        ))}
      </div>
      <div className="sec-title">背景</div>
      <div className="sec-card">
        <div className="sec-row" style={{ cursor: 'pointer' }} onClick={() => setHoneycomb(!honeycomb)}>
          <div className="sec-row-l">
            <div className="sec-row-label">动态蜂巢</div>
            <div className="sec-row-desc">聊天界面背景装饰画布</div>
          </div>
          <button className={`toggle${honeycomb ? ' on' : ''}`} style={{ pointerEvents: 'none' }} />
        </div>
      </div>
    </>
  );

  const renderModel = () => (
    <>
      <div className="sec-title">默认模型</div>
      <div className="sec-card" style={{ marginBottom: '20px' }}>
        <div className="sec-row">
          <select className="model-selector" value={model} onChange={e => handleModelChange(e.target.value)}>
            {models.map(m => (
              <option key={m.id} value={m.id}>{m.label || m.id}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="sec-title">温度</div>
      <div className="sec-card" style={{ marginBottom: '20px' }}>
        <div className="sec-row slider-row">
          <div className="slider-container">
            <input type="range" className="slider" min="0" max="2" step="0.1" value={temperature}
              onChange={e => setTemperature(parseFloat(e.target.value))} />
            <div className="slider-info">
              <span className="slider-desc">控制回复的随机性，值越高越随机</span>
              <span className="slider-value">{temperature.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="sec-title">Top P</div>
      <div className="sec-card" style={{ marginBottom: '20px' }}>
        <div className="sec-row slider-row">
          <div className="slider-container">
            <input type="range" className="slider" min="0" max="1" step="0.05" value={topP}
              onChange={e => setTopP(parseFloat(e.target.value))} />
            <div className="slider-info">
              <span className="slider-desc">核采样参数，控制词汇多样性</span>
              <span className="slider-value">{topP.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="sec-title">上下文长度</div>
      <div className="sec-card">
        <div className="sec-row slider-row">
          <div className="slider-container">
            <input type="range" className="slider" min="0" max="25" step="1" value={contextLength}
              onChange={e => setContextLength(parseInt(e.target.value))} />
            <div className="slider-info">
              <span className="slider-desc">发送给 AI 的历史消息数量</span>
              <span className="slider-value">{contextLength} 条</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const renderKeys = () => (
    <>
      <div className="sec-title">管理密钥</div>
      <div className="sec-card">
        {!keys.length && (
          <div style={{ padding: '16px', color: 'var(--text2)', fontSize: '13.5px' }}>未保存密钥。</div>
        )}
        {keys.map((k, i) => (
          <div className="key-item" key={i}>
            <div className="ki-text">
              <div className="ki-label">{k.slice(0, 6)}{'•'.repeat(8)}{k.slice(-4)}</div>
              <div className="ki-val">{k === activeKey ? '● 已激活' : '未激活'}</div>
            </div>
            {k !== activeKey ? (
              <button className="btn-sm ghost" onClick={() => handleActivateKey(k)}>使用</button>
            ) : (
              <span className="ki-badge active">已激活</span>
            )}
            <button className="btn-sm danger" onClick={() => handleDeleteKey(k)} style={{ padding: '8px 10px' }}>
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
      <div className="add-form">
        <input
          type="password"
          placeholder="pk_…"
          autoComplete="off"
          value={newKey}
          onChange={e => setNewKey(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAddKey(); }}
        />
        <button className="btn-sm" onClick={handleAddKey}>添加</button>
      </div>
    </>
  );

  return (
    <div className="modal-overlay visible" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-hd">
          <span className="modal-title">设置</span>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-tabs">
          <button className={`modal-tab${settingsTab === 'appearance' ? ' active' : ''}`} onClick={() => setSettingsTab('appearance')}>外观</button>
          <button className={`modal-tab${settingsTab === 'model' ? ' active' : ''}`} onClick={() => setSettingsTab('model')}>模型</button>
          <button className={`modal-tab${settingsTab === 'keys' ? ' active' : ''}`} onClick={() => setSettingsTab('keys')}>密钥</button>
        </div>
        <div className="modal-body">
          {settingsTab === 'appearance' && renderAppearance()}
          {settingsTab === 'model' && renderModel()}
          {settingsTab === 'keys' && renderKeys()}
        </div>
      </div>
    </div>
  );
}
