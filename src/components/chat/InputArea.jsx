import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { ArrowUp, Paperclip } from 'lucide-react';
import { useChatStore, useKeyStore, useModelStore, useModeStore, useStreamStore, useUiStore } from '@/status';
import { API } from '@/services/api';
import ModeSelector from './ModeSelector';
import StreamStatus from './StreamStatus';
import useBanner from '@/hooks/useBanner';
import useChats from '@/hooks/useChats';

const ACTION_OVERFLOW_SAFE_SPACE = 16;
const MAX_INLINE_BANNER_ACTIONS = 2;

function areActionIdsEqual(prevIds, nextIds) {
  if (prevIds.length !== nextIds.length) return false;
  return prevIds.every((id, index) => id === nextIds[index]);
}

function BannerActionButton({ action, selected = false, onClick, buttonRef }) {
  return (
    <button
      ref={buttonRef}
      className={`action-btn${selected ? ' selected' : ''}`}
      title={action.name}
      data-action={action.id}
      onClick={onClick}
      type="button"
    >
      <span className="action-btn-icon" dangerouslySetInnerHTML={{ __html: action.iconSvg }} />
      <span className="action-btn-label">{action.name}</span>
    </button>
  );
}

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
        <span className="action-btn-label">更多</span>
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
  const [inlineActionIds, setInlineActionIds] = useState([]);
  const textareaRef = useRef(null);
  const actionsRef = useRef(null);
  const leadingRef = useRef(null);
  const trailingRef = useRef(null);
  const moreMeasureRef = useRef(null);
  const actionMeasureRefs = useRef(new Map());
  const isStreaming = useStreamStore(s => s.isStreaming);
  const setIsStreaming = useStreamStore(s => s.setIsStreaming);
  const setStopRequested = useStreamStore(s => s.setStopRequested);
  const activeChatId = useChatStore(s => s.activeChatId);
  const chats = useChatStore(s => s.chats);
  const model = useModelStore(s => s.model);
  const contextLength = useModelStore(s => s.contextLength);
  const currentMode = useModeStore(s => s.currentMode);
  const modeConfig = useModeStore(s => s.modeConfig);
  const temperature = useModelStore(s => s.temperature);
  const topP = useModelStore(s => s.topP);
  const activeKey = useKeyStore(s => s.activeKey);
  const showToast = useUiStore(s => s.showToast);
  const currentBannerMode = useModeStore(s => s.currentBannerMode);
  const setCurrentBannerMode = useModeStore(s => s.setCurrentBannerMode);
  const setBannerPrompt = useModeStore(s => s.setBannerPrompt);
  const { createChat, addMessage } = useChats();

  const { bannerConfig, handleAction, clearSelection } = useBanner();
  const hasText = inputValue.trim().length > 0;

  const bannerActions = bannerConfig?.actions || [];

  const setActionMeasureRef = useCallback((actionId, node) => {
    if (node) {
      actionMeasureRefs.current.set(actionId, node);
    } else {
      actionMeasureRefs.current.delete(actionId);
    }
  }, []);

  const updateInlineActions = useCallback(() => {
    if (currentBannerMode) {
      setInlineActionIds(prevIds => (prevIds.length === 0 ? prevIds : []));
      return;
    }

    const actionsEl = actionsRef.current;
    const leadingEl = leadingRef.current;
    const trailingEl = trailingRef.current;
    const moreEl = moreMeasureRef.current;

    if (!actionsEl || !leadingEl || !trailingEl) return;

    const availableWidth = actionsEl.getBoundingClientRect().width
      - leadingEl.getBoundingClientRect().width
      - trailingEl.getBoundingClientRect().width
      - ACTION_OVERFLOW_SAFE_SPACE;

    if (availableWidth <= 0) {
      setInlineActionIds(prevIds => (prevIds.length === 0 ? prevIds : []));
      return;
    }

    const inlineCandidates = bannerActions.slice(0, MAX_INLINE_BANNER_ACTIONS);
    const baseOverflowActions = bannerActions.slice(MAX_INLINE_BANNER_ACTIONS);
    const measuredIds = [];
    const widthById = new Map();

    for (const action of inlineCandidates) {
      const measuredButton = actionMeasureRefs.current.get(action.id);
      const width = measuredButton?.getBoundingClientRect().width || 0;
      if (!width) {
        window.requestAnimationFrame(updateInlineActions);
        return;
      }
      measuredIds.push(action.id);
      widthById.set(action.id, width);
    }

    const moreWidth = moreEl?.getBoundingClientRect().width || 0;
    if (bannerActions.length > 0 && !moreWidth) {
      window.requestAnimationFrame(updateInlineActions);
      return;
    }

    const visibleIds = [...measuredIds];
    let overflowCount = baseOverflowActions.length;
    let usedWidth = visibleIds.reduce((sum, actionId) => sum + (widthById.get(actionId) || 0), 0);

    while (visibleIds.length > 0 && usedWidth + (overflowCount > 0 ? moreWidth : 0) > availableWidth) {
      const removedId = visibleIds.pop();
      usedWidth -= widthById.get(removedId) || 0;
      overflowCount += 1;
    }

    setInlineActionIds(prevIds => (areActionIdsEqual(prevIds, visibleIds) ? prevIds : visibleIds));
  }, [bannerActions, currentBannerMode]);

  useLayoutEffect(() => {
    const frameId = window.requestAnimationFrame(updateInlineActions);
    return () => window.cancelAnimationFrame(frameId);
  }, [updateInlineActions]);

  useEffect(() => {
    const scheduleUpdate = () => window.requestAnimationFrame(updateInlineActions);
    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => scheduleUpdate())
      : null;

    if (resizeObserver) {
      if (actionsRef.current) resizeObserver.observe(actionsRef.current);
      if (leadingRef.current) resizeObserver.observe(leadingRef.current);
      if (trailingRef.current) resizeObserver.observe(trailingRef.current);
    } else {
      window.addEventListener('resize', scheduleUpdate);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener('resize', scheduleUpdate);
      }
    };
  }, [updateInlineActions]);

  const activeBannerAction = currentBannerMode
    ? bannerActions.find(action => action.id === currentBannerMode) || null
    : null;
  const inlineBannerActions = currentBannerMode
    ? (activeBannerAction ? [activeBannerAction] : [])
    : bannerActions
      .slice(0, MAX_INLINE_BANNER_ACTIONS)
      .filter(action => inlineActionIds.includes(action.id));
  const overflowBannerActions = currentBannerMode
    ? []
    : [
      ...bannerActions
        .slice(0, MAX_INLINE_BANNER_ACTIONS)
        .filter(action => !inlineActionIds.includes(action.id)),
      ...bannerActions.slice(MAX_INLINE_BANNER_ACTIONS),
    ];

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

    if (!activeChatId) await createChat();

    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const chatId = useChatStore.getState().activeChatId || activeChatId;
    addMessage('user', text);

    setIsStreaming(true);
    setStopRequested(false);

    let fullResp = '';
    try {
      const chat = useChatStore.getState().chats.find(c => c.id === (useChatStore.getState().activeChatId || chatId));
      const allMsgs = (chat?.messages || []).filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content }));
      const msgs = contextLength > 0 ? allMsgs.slice(-contextLength) : [];

      let modelToUse = model;
      if (currentMode === 'expert' && modeConfig.expert?.model) {
        modelToUse = modeConfig.expert.model;
      }

      for await (const chunk of API.stream(msgs, modelToUse)) {
        if (useStreamStore.getState().stopRequested) break;
        fullResp += chunk;
      }

      if (fullResp) {
        addMessage('assistant', fullResp);
      }
    } catch (e) {
      if (!useStreamStore.getState().stopRequested) {
        showToast('请求失败，请重试', 'error');
        addMessage('assistant', `⚠ ${e?.message || 'Error'}`);
      }
    }

    setIsStreaming(false);
  }, [inputValue, isStreaming, activeChatId, createChat, addMessage, setIsStreaming, setStopRequested, model, contextLength, currentMode, modeConfig]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
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
        <div className="input-actions" ref={actionsRef}>
          <div className="input-actions-leading" ref={leadingRef}>
            <button className="action-btn" title="附件" id="attachBtn" type="button">
              <Paperclip size={18} />
            </button>
            <div className="divider" />
            <ModeSelector />
          </div>
          <div className="input-actions-center">
            {inlineBannerActions.map(action => (
              <BannerActionButton
                key={action.id}
                action={action}
                selected={currentBannerMode === action.id}
                onClick={() => handleBannerClick(action)}
              />
            ))}
            {overflowBannerActions.length > 0 && (
              <MoreDropdown actions={overflowBannerActions} onAction={handleBannerClick} />
            )}
          </div>
          <div className="spacer" />
          <div className="input-actions-trailing" ref={trailingRef}>
            <button
              className={`send-btn${hasText ? ' active' : ''}`}
              id="send-btn"
              title="发送"
              onClick={handleSend}
              disabled={!hasText || isStreaming}
              style={isStreaming ? { display: 'none' } : {}}
              type="button"
            >
              <ArrowUp size={20} />
            </button>
            <button
              className={`stop-btn${isStreaming ? ' visible' : ''}`}
              id="stop-btn"
              onClick={handleStop}
              type="button"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
            </button>
          </div>
        </div>
        <div className="input-actions-measure" aria-hidden="true">
          {bannerActions.map(action => (
            <BannerActionButton
              key={`measure-${action.id}`}
              action={action}
              buttonRef={(node) => setActionMeasureRef(action.id, node)}
            />
          ))}
          <button className="action-btn" ref={moreMeasureRef} type="button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
              <rect x="15" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
              <rect x="3" y="15" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
              <rect x="15" y="15" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <span className="action-btn-label">更多</span>
          </button>
        </div>
      </div>
      <div className="input-hint">Ctrl+Enter 发送，回复可能包含错误</div>
    </div>
  );
}
