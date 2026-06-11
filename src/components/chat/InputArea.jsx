import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { ArrowUp, Square, Paperclip } from 'lucide-react';
import useAppStore from '@/store/useAppStore';
import { API } from '@/services/api';
import ModeSelector from './ModeSelector';
import StreamStatus from './StreamStatus';
import useBanner from '@/hooks/useBanner';

function MoreDropdown({ actions, onAction }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const positionMenu = useCallback(() => {
    const btn = btnRef.current;
    const menu = menuRef.current;
    if (!btn || !menu) return;
    const rect = btn.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const gap = 8;
    let top = rect.top - menuRect.height - gap;
    let left = rect.left;
    if (top < 8) top = rect.bottom + gap;
    if (left + menuRect.width > window.innerWidth - 8) left = window.innerWidth - menuRect.width - 8;
    if (left < 8) left = 8;
    menu.style.top = top + 'px';
    menu.style.left = left + 'px';
  }, []);

  useLayoutEffect(() => {
    if (open) positionMenu();
  }, [open, positionMenu]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) && btnRef.current && !btnRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [open]);

  return (
    <div className="dropdown-wrapper more-dropdown-wrapper">
      <button
        className="action-btn"
        ref={btnRef}
        title="更多"
        id="moreBtn"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <rect x="15" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <rect x="3" y="15" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <rect x="15" y="15" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <span>更多</span>
      </button>
      <div
        className={`dropdown-menu more-menu${open ? ' show' : ''}`}
        id="moreMenu"
        ref={menuRef}
        onClick={(e) => e.stopPropagation()}
      >
        {actions.map(action => (
          <div
            key={action.id}
            className="dropdown-item"
            data-action={action.id}
            onClick={() => { setOpen(false); onAction(action); }}
          >
            <div className="dropdown-item-header">
              <span dangerouslySetInnerHTML={{ __html: action.iconSvg }} />
              <span>{action.name}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function InputArea({ onOpenModal, scrollBtnProps }) {
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef(null);
  const isStreaming = useAppStore(s => s.isStreaming);
  const setIsStreaming = useAppStore(s => s.setIsStreaming);
  const setStopRequested = useAppStore(s => s.setStopRequested);
  const activeChatId = useAppStore(s => s.activeChatId);
  const createChat = useAppStore(s => s.createChat);
  const addMessage = useAppStore(s => s.addMessage);
  const chats = useAppStore(s => s.chats);
  const model = useAppStore(s => s.model);
  const contextLength = useAppStore(s => s.contextLength);
  const currentMode = useAppStore(s => s.currentMode);
  const modeConfig = useAppStore(s => s.modeConfig);
  const temperature = useAppStore(s => s.temperature);
  const topP = useAppStore(s => s.topP);
  const activeKey = useAppStore(s => s.activeKey);
  const showToast = useAppStore(s => s.showToast);
  const currentBannerMode = useAppStore(s => s.currentBannerMode);
  const setCurrentBannerMode = useAppStore(s => s.setCurrentBannerMode);
  const setBannerPrompt = useAppStore(s => s.setBannerPrompt);

  const { bannerConfig, handleAction, clearSelection } = useBanner();
  const hasText = inputValue.trim().length > 0;

  const bannerActions = bannerConfig?.actions || [];
  const visibleBannerActions = bannerActions.slice(0, 2);
  const moreBannerActions = bannerActions.slice(2);

  const handleBannerClick = useCallback(async (action) => {
    if (currentBannerMode === action.id) {
      clearSelection();
      showToast(`已退出${action.name}模式`);
      return;
    }
    await handleAction(action);
    showToast(`已切换到${action.name}模式`);
  }, [currentBannerMode, clearSelection, handleAction, showToast]);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 168) + 'px';
  }, []);

  useEffect(() => {
    autoResize();
  }, [inputValue, autoResize]);

  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || isStreaming) return;

    if (!activeChatId) createChat();

    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const chatId = useAppStore.getState().activeChatId || activeChatId;
    addMessage('user', text);

    setIsStreaming(true);
    setStopRequested(false);

    let fullResp = '';
    try {
      const chat = useAppStore.getState().chats.find(c => c.id === (useAppStore.getState().activeChatId || chatId));
      const allMsgs = (chat?.messages || []).filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content }));
      const msgs = contextLength > 0 ? allMsgs.slice(-contextLength) : [];

      let modelToUse = model;
      if (currentMode === 'expert' && modeConfig.expert?.model) {
        modelToUse = modeConfig.expert.model;
      }

      for await (const chunk of API.stream(msgs, modelToUse)) {
        if (useAppStore.getState().stopRequested) break;
        fullResp += chunk;
      }

      if (fullResp) {
        addMessage('assistant', fullResp);
      }
    } catch (e) {
      if (!useAppStore.getState().stopRequested) {
        addMessage('assistant', `⚠ ${e?.message || 'Error'}`);
      }
    }

    setIsStreaming(false);
  }, [inputValue, isStreaming, activeChatId, createChat, addMessage, setIsStreaming, setStopRequested, model, contextLength, currentMode, modeConfig]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStop = () => {
    setStopRequested(true);
    setIsStreaming(false);
  };

  const scrollState = scrollBtnProps?.current;

  const placeholder = currentBannerMode
    ? `在${bannerActions.find(a => a.id === currentBannerMode)?.name || ''}模式下发消息...`
    : '发消息...';

  return (
    <div id="input-area">
      <button
        id="scroll-btn"
        className={scrollState?.showScrollBtn ? 'visible' : ''}
        onClick={() => scrollState?.scrollToBottom?.(true)}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
        <span>滚动到底部</span>
      </button>
      <StreamStatus />
      <div className="input-container">
        <div className="input-wrapper">
          <textarea
            ref={textareaRef}
            id="msg-input"
            rows="1"
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="input-actions">
          <button className="action-btn" title="附件" id="attachBtn">
            <Paperclip size={18} />
          </button>
          <div className="divider" />
          <ModeSelector />
          {visibleBannerActions.map(action => (
            <button
              key={action.id}
              className={`action-btn${currentBannerMode === action.id ? ' selected' : ''}`}
              title={action.name}
              data-action={action.id}
              onClick={() => handleBannerClick(action)}
              style={currentBannerMode && currentBannerMode !== action.id ? { display: 'none' } : {}}
            >
              <span dangerouslySetInnerHTML={{ __html: action.iconSvg }} />
              <span>{action.name}</span>
            </button>
          ))}
          {moreBannerActions.length > 0 && (
            <div style={currentBannerMode ? { display: 'none' } : {}}>
              <MoreDropdown actions={moreBannerActions} onAction={handleBannerClick} />
            </div>
          )}
          <div className="spacer" />
          <button
            className={`send-btn${hasText ? ' active' : ''}`}
            id="send-btn"
            title="发送"
            onClick={handleSend}
            disabled={!hasText || isStreaming}
            style={isStreaming ? { display: 'none' } : {}}
          >
            <ArrowUp size={20} />
          </button>
          <button
            className={`stop-btn${isStreaming ? ' visible' : ''}`}
            id="stop-btn"
            onClick={handleStop}
          >
            <Square size={14} />
          </button>
        </div>
      </div>
      <div className="input-hint">回复可能包含错误</div>
    </div>
  );
}
