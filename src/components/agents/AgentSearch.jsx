import { Search, X } from 'lucide-react';

export default function AgentSearch({ value, onChange, onClear }) {
  return (
    <div className="agents-search">
      <Search className="search-icon" size={16} />
      <input
        type="text"
        id="agents-search-input"
        placeholder="搜索智能体..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        className={`search-clear-btn${value ? ' visible' : ''}`}
        id="agents-search-clear"
        title="清除"
        onClick={onClear}
      >
        <X size={14} />
      </button>
    </div>
  );
}
