import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowUp, Paperclip } from 'lucide-react';
import { useChatStore, useKeyStore, useModelStore, useModeStore, useStreamStore, useUiStore } from '@/status';
import { API } from '@/services/api';
import ModeSelector from './ModeSelector';
import StreamStatus from './StreamStatus';
import useBanner from '@/hooks/useBanner';
import useChats from '@/hooks/useChats';
import type { ModeType, ModeConfig, BannerAction } from '@/types';

const ACTION_OVERFLOW_SAFE_SPACE = 16;
const MAX_INLINE_BANNER_ACTIONS = 2;

interface BannerActionItem {
  id: string;
  name: string;
  icon: string;
  iconSvg: string;
  prompt: string;
  mode?: string;
}

interface ScrollBtnState {
  showScrollBtn: boolean;
  scrollToBottom: (force?: boolean) => void;
}

interface InputAreaProps {
  onOpenModal?: () => void;
  scrollBtnProps?: React.RefObject<ScrollBtnState | null>;
}

function areActionIdsEqual(prevIds: string[], nextIds: string[]): boolean {
  if (prevIds.length !== nextIds.length) return false;
  return prevIds.every((id, index) => id === nextIds[index]);
}

interface BannerActionButtonProps {
  action: BannerActionItem;
  selected?: boolean;
  onClick: () => void;
  buttonRef?: (node: HTMLButtonElement | null) => void;
}

function BannerActionButton({ action, selected = false, onClick, buttonRef }: BannerActionButtonProps) {
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

interface MoreDropdownProps {
  actions: BannerActionItem[];
  onAction: (action: BannerActionItem) => void;
}

function MoreDropdown({ actions, onAction }: MoreDropdownProps) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) && btnRef.current && !btnRef.current.contains(e.target as Node)) {
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
        onClick={(e: React.MouseEvent) => { e.stopPropagation(); setOpen(!open); }}
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
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
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

export default function InputArea({ onOpenModal, scrollBtnProps }: InputAreaProps) {
  const [inputValue, setInputValue] = useState('');
  const [inlineActionIds, setInlineActionIds] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const leadingRef = useRef<HTMLDivElement>(null);
  const trailingRef = useRef<HTMLDivElement>(null);
  const moreMeasureRef = useRef<HTMLButtonElement>(null);
  const actionMeasureRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const abortControllers = useRef<Map<string, AbortController>>(new Map());
  const streamingChatIds = useStreamStore(s => s.streamingChatIds);
  const setStopRequested = useStreamStore(s => s.setStopRequested);
  const addStreamingChat = useStreamStore(s => s.addStreamingChat);
  const removeStreamingChat = useStreamStore(s => s.removeStreamingChat);
  const activeChatId = useChatStore(s => s.activeChatId);
  const isStreamingThisChat = activeChatId !== null && streamingChatIds.has(activeChatId);
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
  const { createChat, addMessage, updateMessageContent, setMessageStatus, stopMessage, saveChat, setMessageError } = useChats();

  const { bannerConfig, handleAction, clearSelection } = useBanner();
  const hasText = inputValue.trim().length > 0;

  const bannerActions: BannerActionItem[] = (bannerConfig as { actions?: BannerActionItem[] } | null)?.actions || [];

  const setActionMeasureRef = useCallback((actionId: string, node: HTMLButtonElement | null) => {
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
    const measuredIds: string[] = [];
    const widthById = new Map<string, number>();

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
      const removedId = visibleIds.pop()!;
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

  const handleBannerClick = useCallback(async (action: BannerActionItem) => {
    if (currentBannerMode === action.id) {
      clearSelection();
      showToast(`已退出${action.name}模式`);
      return;
    }
    await handleAction(action as unknown as BannerAction);
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
    if (!text || isStreamingThisChat) return;

    let chatId = activeChatId;
    if (!chatId) {
      const newChat = await createChat();
      chatId = newChat.id;
    }
    if (!chatId) return;

    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    addMessage('user', text, chatId);

    // 流开始：创建空的 assistant 消息
    const assistantMsgId = await addMessage('assistant', '', chatId, 'streaming');

    setStopRequested(chatId, false);
    addStreamingChat(chatId);

    const controller = new AbortController();
    abortControllers.current.set(chatId, controller);

    // 流式渲染：用 rAF 节流
    let accumulated = '';
    let rafId = 0;
    const flushUpdate = () => {
      updateMessageContent(chatId, assistantMsgId, accumulated);
    };

    try {
      const chat = useChatStore.getState().chats.find(c => c.id === chatId);
      const filteredMsgs = (chat?.messages || []).filter(m => m.role !== 'system' && m.id !== assistantMsgId);
      const msgs = contextLength > 0 ? filteredMsgs.slice(-contextLength) : [];

      let modelToUse = model;
      if (currentMode === 'expert' && modeConfig.expert?.model) {
        modelToUse = modeConfig.expert.model;
      }

      for await (const chunk of API.stream(msgs, modelToUse, chatId, controller.signal)) {
        if (useStreamStore.getState().isStopRequested(chatId)) break;
        accumulated += chunk;
        if (!rafId) {
          rafId = requestAnimationFrame(() => { rafId = 0; flushUpdate(); });
        }
      }

      // 流结束：最终刷新 + 持久化
      cancelAnimationFrame(rafId);
      if (accumulated) {
        updateMessageContent(chatId, assistantMsgId, accumulated);
        if (useStreamStore.getState().isStopRequested(chatId)) {
          stopMessage(chatId, assistantMsgId);
          await setMessageStatus(chatId, assistantMsgId, 'stopped');
        } else {
          await setMessageStatus(chatId, assistantMsgId, 'completed');
        }
        const finalChat = useChatStore.getState().chats.find(c => c.id === chatId);
        if (finalChat) await saveChat(finalChat);
      } else {
        // 空响应：移除空的 assistant 消息
        useChatStore.setState({
          chats: useChatStore.getState().chats.map(c =>
            c.id === chatId ? { ...c, messages: c.messages.filter(m => m.id !== assistantMsgId) } : c
          ),
        });
        const finalChat = useChatStore.getState().chats.find(c => c.id === chatId);
        if (finalChat) await saveChat(finalChat);
      }
    } catch (e: unknown) {
      cancelAnimationFrame(rafId);
      if (!useStreamStore.getState().isStopRequested(chatId)) {
        showToast('请求失败，请重试', 'error');
        await setMessageError(chatId, assistantMsgId, e instanceof Error ? e.message : 'Error');
        const finalChat = useChatStore.getState().chats.find(c => c.id === chatId);
        if (finalChat) await saveChat(finalChat);
      } else if (accumulated) {
        // 用户停止但已有部分内容，保留并持久化
        updateMessageContent(chatId, assistantMsgId, accumulated);
        stopMessage(chatId, assistantMsgId);
        await setMessageStatus(chatId, assistantMsgId, 'stopped');
        const finalChat = useChatStore.getState().chats.find(c => c.id === chatId);
        if (finalChat) await saveChat(finalChat);
      }
    }

    abortControllers.current.delete(chatId);
    if (useStreamStore.getState().streamingChatIds.has(chatId)) {
      removeStreamingChat(chatId);
    }
  }, [inputValue, activeChatId, createChat, addMessage, updateMessageContent, setMessageStatus, stopMessage, saveChat, setStopRequested, addStreamingChat, removeStreamingChat, model, contextLength, currentMode, modeConfig, showToast]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStop = () => {
    if (activeChatId) {
      setStopRequested(activeChatId, true);
      abortControllers.current.get(activeChatId)?.abort();
    }
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
            rows={1}
            placeholder={placeholder}
            value={inputValue}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputValue(e.target.value)}
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
              disabled={!hasText || isStreamingThisChat}
              style={isStreamingThisChat ? { display: 'none' } as React.CSSProperties : undefined}
              type="button"
            >
              <ArrowUp size={20} />
            </button>
            <button
              className={`stop-btn${isStreamingThisChat ? ' visible' : ''}`}
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
              onClick={() => {}}
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
