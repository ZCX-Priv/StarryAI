import { Brain, Sun, Moon, ChevronDown, Menu, Bot } from 'lucide-react';
import { useChatStore, useModelStore, useMemoryStore } from '@/status';
import useTheme from '@/hooks/useTheme';

export default function Topbar({ onOpenModal, onToggleSidebar }) {
  const chats = useChatStore(s => s.chats);
  const activeChatId = useChatStore(s => s.activeChatId);
  const model = useModelStore(s => s.model);
  const models = useModelStore(s => s.models);
  const memory = useMemoryStore(s => s.memory);
  const { isDark, toggle } = useTheme();

  const activeChat = chats.find(c => c.id === activeChatId);
  const chatTitle = (!activeChat?.title || activeChat.title === '新对话') ? '新对话' : activeChat.title;
  const currentModel = models.find(m => m.id === model);
  const modelLabel = currentModel ? currentModel.label : model;
  const hasMemory = memory.length > 0;

  return (
    <div id="topbar">
      <div className="tb-left">
        <button className="tb-toggle" onClick={() => onToggleSidebar?.current?.()}>
          <Menu size={17} />
        </button>
        <span className="tb-title">{chatTitle}</span>
      </div>
      <div className="tb-right">
        <button
          className={`brain-btn${hasMemory ? ' has-mem' : ''}`}
          onClick={() => onOpenModal('memory')}
        >
          <div className="mem-dot" />
          <Brain size={16} />
        </button>
        <button className="model-pill" onClick={() => onOpenModal('model')} title="">
          <Bot size={16} />
          <span>{modelLabel}</span>
          <ChevronDown size={10} style={{ opacity: 0.5 }} />
        </button>
        <button className="icon-btn" onClick={toggle}>
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </div>
  );
}
