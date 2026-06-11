import { X } from 'lucide-react';

export default function AgentCard({ agent, onSelect, onDelete }) {
  const isCustom = agent.isCustom;
  const avatarHtml = isCustom ? (
    <div className="card-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', background: 'var(--bg3)', borderRadius: 'var(--radius)' }}>
      {agent.emoji || '🤖'}
    </div>
  ) : (
    <img src={`/${agent.avatar}`} alt={agent.name} className="card-avatar" onError={(e) => { e.target.style.display = 'none'; }} />
  );

  return (
    <div
      className={`agent-card${isCustom ? ' custom-agent' : ''}`}
      onClick={() => onSelect(agent.id)}
    >
      {avatarHtml}
      <div className="card-content">
        <div className="card-name">
          {agent.name}
          {isCustom && <span className="custom-agent-badge">自定义</span>}
        </div>
        <div className="card-desc">{agent.description}</div>
      </div>
      {isCustom && (
        <button
          className="agent-delete-btn"
          onClick={(e) => { e.stopPropagation(); onDelete(agent.id); }}
          title="删除智能体"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
