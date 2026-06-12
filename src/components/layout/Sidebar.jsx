import { useState, useCallback, useRef, useEffect } from 'react';
import { Plus, Users, Settings, MessageSquare, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { useChatStore, useUiStore } from '@/status';
import EmptyState from '@/components/ui/EmptyState';

export default function Sidebar({ onOpenModal, onToggleSidebar }) {
  const chats = useChatStore(s => s.chats);
  const activeChatId = useChatStore(s => s.activeChatId);
  const createChat = useChatStore(s => s.createChat);
  const switchToChat = useChatStore(s => s.switchToChat);
  const deleteChat = useChatStore(s => s.deleteChat);
  const renameChat = useChatStore(s => s.renameChat);
  const setCurrentPage = useUiStore(s => s.setCurrentPage);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNewChat = useCallback(() => {
    createChat();
    if (window.innerWidth <= 680) setMobileOpen(false);
  }, [createChat]);

  const handleSwitchChat = useCallback((id) => {
    switchToChat(id);
    if (window.innerWidth <= 680) setMobileOpen(false);
  }, [switchToChat]);

  const handleAgents = useCallback(() => {
    setCurrentPage('agents');
    if (window.innerWidth <= 680) setMobileOpen(false);
  }, [setCurrentPage]);

  const handleToggle = useCallback(() => {
    if (window.innerWidth <= 680) {
      setMobileOpen(prev => !prev);
    } else {
      setCollapsed(prev => !prev);
    }
  }, []);

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
  }, []);

  useEffect(() => {
    if (onToggleSidebar) onToggleSidebar.current = handleToggle;
  }, [handleToggle, onToggleSidebar]);

  const sidebarClass = [
    collapsed && window.innerWidth > 680 ? 'collapsed' : '',
    mobileOpen && window.innerWidth <= 680 ? 'open' : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      <div
        id="sb-overlay"
        className={mobileOpen ? 'visible' : ''}
        onClick={closeMobile}
      />
      <aside id="sidebar" className={sidebarClass}>
        <div className="sb-head">
          <div className="sb-logo">
            <div className="sb-logo-mark">
              <img src="/logo.png" alt="Logo" />
            </div>
            <span className="sb-logo-name">星语</span>
          </div>
          <div className="sb-btns">
            <button className="btn-new" onClick={handleNewChat}>
              <Plus size={15} />
              <span>新对话</span>
            </button>
            <button className="btn-agents" onClick={handleAgents}>
              <Users size={15} />
              <span>智能体</span>
            </button>
          </div>
        </div>
        <div className="sb-section">对话</div>
        <div className="chat-list">
          {chats.length === 0 ? (
            <EmptyState icon={MessageSquare} title="暂无对话" description="点击上方按钮开始新对话" compact />
          ) : (
            chats.map(chat => (
              <ChatItem
                key={chat.id}
                chat={chat}
                isActive={chat.id === activeChatId}
                onSwitch={handleSwitchChat}
                onDelete={deleteChat}
                onRename={renameChat}
                openMenuId={openMenuId}
                setOpenMenuId={setOpenMenuId}
                onOpenModal={onOpenModal}
              />
            ))
          )}
        </div>
        <div className="sb-bottom">
          <button className="sb-btn" onClick={() => onOpenModal('settings')}>
            <Settings size={15} />
            <span>设置</span>
          </button>
        </div>
      </aside>
    </>
  );
}

function ChatItem({ chat, isActive, onSwitch, onDelete, onRename, openMenuId, setOpenMenuId, onOpenModal }) {
  const [renameValue, setRenameValue] = useState('');
  const menuRef = useRef(null);

  const displayTitle = (!chat.title || chat.title === '新对话') ? '新对话' : chat.title;

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === chat.id ? null : chat.id);
  };

  const handleRename = (e) => {
    e.stopPropagation();
    setOpenMenuId(null);
    onOpenModal('rename', chat.id);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setOpenMenuId(null);
    onOpenModal('confirmDelete', chat.id);
  };

  useEffect(() => {
    const handler = () => setOpenMenuId(null);
    if (openMenuId === chat.id) {
      document.addEventListener('click', handler);
      return () => document.removeEventListener('click', handler);
    }
  }, [openMenuId, chat.id, setOpenMenuId]);

  return (
    <div
      className={`chat-item${isActive ? ' active' : ''}`}
      onClick={() => onSwitch(chat.id)}
    >
      <div className="ci-icon"><MessageSquare size={13} /></div>
      <div className="ci-title">{displayTitle}</div>
      <button className="ci-menu-btn" onClick={handleMenuClick} title="更多操作">
        <MoreHorizontal size={14} />
      </button>
      <div className={`ci-dropdown${openMenuId === chat.id ? ' show' : ''}`} ref={menuRef}>
        <button className="ci-dropdown-item" onClick={handleRename}>
          <Pencil size={14} />
          <span>编辑名称</span>
        </button>
        <button className="ci-dropdown-item ci-dropdown-danger" onClick={handleDelete}>
          <Trash2 size={14} />
          <span>删除对话</span>
        </button>
      </div>
    </div>
  );
}
