import { useState, useMemo } from 'react';
import { X, Search, Gem, Atom } from 'lucide-react';
import { useModelStore } from '@/status';
import useModels from '@/hooks/useModels';
import { formatContextLength } from '@/lib/config';
import EmptyState from '@/components/ui/EmptyState';

export default function ModelPickerDialog({ visible, onClose }) {
  const model = useModelStore(s => s.model);
  const models = useModelStore(s => s.models);
  const { setModel: setModelPersist } = useModels();
  const [search, setSearch] = useState('');

  const filteredModels = useMemo(() => {
    if (!search) return models;
    const lower = search.toLowerCase();
    return models.filter(m =>
      (m.label || m.id).toLowerCase().includes(lower) || m.id.toLowerCase().includes(lower)
    );
  }, [models, search]);

  if (!visible) return null;

  const handleSelect = (id) => {
    setModelPersist(id);
    onClose();
  };

  return (
    <div className="modal-overlay visible" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: '420px' }}>
        <div className="modal-hd">
          <span className="modal-title">选择模型</span>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="mp-search-wrapper">
            <Search className="mp-search-icon" size={16} />
            <input
              type="text"
              className="mp-search-input"
              placeholder="搜索模型..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="mp-search-clear" onClick={() => setSearch('')}>
                <X size={14} />
              </button>
            )}
          </div>
          <div className="mp-models-wrap">
            {filteredModels.length === 0 ? (
              <EmptyState icon={Search} title="未找到匹配的模型" description="尝试其他关键词" compact />
            ) : (
            <div className="sec-card" style={{ margin: 0 }}>
              {filteredModels.map(m => {
                const active = m.id === model;
                return (
                  <div
                    key={m.id}
                    className={`mp-model-row${active ? ' mp-active' : ''}`}
                    onClick={() => handleSelect(m.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                        background: active ? 'var(--accent2)' : 'transparent',
                      }} />
                      <span style={{
                        fontSize: '13.5px', fontWeight: active ? 600 : 400,
                        color: active ? 'var(--accent2)' : 'var(--text)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {m.label || m.id}
                      </span>
                      {m.paidOnly && <Gem size={12} style={{ flexShrink: 0, marginLeft: 4, color: '#9CA3AF' }} />}
                      {m.reasoning && <Atom size={12} style={{ flexShrink: 0, marginLeft: 4, color: 'var(--accent2)' }} />}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {m.contextLength && <span className="mp-context-tag">{formatContextLength(m.contextLength)}</span>}
                      {active ? (
                        <svg style={{ flexShrink: 0, color: 'var(--accent2)' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : <div style={{ width: 14 }} />}
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
