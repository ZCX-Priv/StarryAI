import { X } from 'lucide-react';
import type { AgentItem } from '@/types';

type CustomAgent = Omit<AgentItem, 'avatar'> & {
  isCustom: boolean;
  prompt: string;
  emoji?: string;
  avatar: string | null;
};

interface AgentCardProps {
  agent: CustomAgent;
  isCurrent?: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function AgentCard({ agent, isCurrent, onSelect, onDelete }: AgentCardProps) {
  const isCustom = agent.isCustom;
  const avatarHtml = isCustom ? (
    <div className="card-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', background: 'var(--bg3)', borderRadius: 'var(--radius)' } as React.CSSProperties}>
      {agent.emoji || '🤖'}
    </div>
  ) : (
    <img src={`/${agent.avatar}`} alt={agent.name} className="card-avatar" onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = 'none'; }} />
  );

  return (
    <div
      className={`agent-card${isCustom ? ' custom-agent' : ''}${isCurrent ? ' current-agent' : ''}`}
      onClick={() => onSelect(agent.id)}
    >
      {avatarHtml}
      <div className="card-content">
        <div className="card-name">
          {agent.name}
          {isCurrent && <span className="current-agent-badge">当前</span>}
          {isCustom && <span className="custom-agent-badge">自定义</span>}
        </div>
        <div className="card-desc">{agent.description}</div>
      </div>
      {isCustom && (
        <button
          className="agent-delete-btn"
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); onDelete(agent.id); }}
          title="删除智能体"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
