import { useState, useRef, useCallback, useEffect } from 'react';
import { useChatStore, useModelStore, useModeStore, useStreamStore, useUiStore } from '@/status';
import { API } from '@/services/api';
import useChats from '@/hooks/useChats';
import MessageList from './MessageList';

interface ScrollBtnState {
  showScrollBtn: boolean;
  scrollToBottom: (force?: boolean) => void;
}

interface ChatAreaProps {
  onOpenModal?: () => void;
  scrollBtnProps?: React.RefObject<ScrollBtnState | null>;
}

export default function ChatArea({ onOpenModal, scrollBtnProps }: ChatAreaProps) {
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const autoScroll = useStreamStore(s => s.autoScroll);
  const setAutoScroll = useStreamStore(s => s.setAutoScroll);
  const isStreaming = useStreamStore(s => s.isStreaming);
  const activeChatId = useChatStore(s => s.activeChatId);
  const chats = useChatStore(s => s.chats);
  const model = useModelStore(s => s.model);
  const contextLength = useModelStore(s => s.contextLength);
  const currentMode = useModeStore(s => s.currentMode);
  const modeConfig = useModeStore(s => s.modeConfig);
  const setIsStreaming = useStreamStore(s => s.setIsStreaming);
  const setStopRequested = useStreamStore(s => s.setStopRequested);
  const showToast = useUiStore(s => s.showToast);
  const { addMessage, saveChat } = useChats();
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const scrollToBottom = useCallback((force = true) => {
    const area = chatAreaRef.current;
    if (!area) return;
    if (force) setAutoScroll(true);
    area.scrollTo({ top: area.scrollHeight, behavior: force ? 'smooth' : 'auto' });
    area.scrollTop = area.scrollHeight;
    requestAnimationFrame(() => { area.scrollTop = area.scrollHeight; });
    setShowScrollBtn(false);
  }, [setAutoScroll]);

  // Expose scroll state to parent via scrollBtnProps ref
  useEffect(() => {
    if (scrollBtnProps) {
      scrollBtnProps.current = { showScrollBtn, scrollToBottom };
    }
  }, [showScrollBtn, scrollToBottom, scrollBtnProps]);

  useEffect(() => {
    const area = chatAreaRef.current;
    if (!area) return;
    let tick = false;
    const handler = () => {
      if (tick) return;
      tick = true;
      requestAnimationFrame(() => {
        tick = false;
        const a = chatAreaRef.current;
        if (!a) return;
        const atBottom = (a.scrollHeight - a.scrollTop - a.clientHeight) < 60;
        setAutoScroll(atBottom);
        setShowScrollBtn(!atBottom);
      });
    };
    area.addEventListener('scroll', handler, { passive: true });
    return () => area.removeEventListener('scroll', handler);
  }, [setAutoScroll]);

  useEffect(() => {
    if (autoScroll) scrollToBottom(false);
  }, [chats, activeChatId, autoScroll, scrollToBottom]);

  const handleRegenerate = useCallback(async () => {
    const chat = chats.find(c => c.id === activeChatId);
    if (!chat || isStreaming) return;

    if (chat.messages[chat.messages.length - 1]?.role === 'assistant') {
      chat.messages.pop();
      useChatStore.setState({ chats: [...useChatStore.getState().chats] });
      await saveChat(chat);
    }

    const allMsgs = chat.messages.map(m => ({ role: m.role, content: m.content, ts: m.ts }));
    const msgs = contextLength > 0 ? allMsgs.slice(-contextLength) : [];
    const modelToUse = chat.model || model;

    setIsStreaming(true);
    setStopRequested(false);
    let fullResp = '';
    try {
      for await (const chunk of API.stream(msgs, modelToUse)) {
        if (useStreamStore.getState().stopRequested) break;
        fullResp += chunk;
      }
      if (fullResp) addMessage('assistant', fullResp);
    } catch (e: unknown) {
      if (!useStreamStore.getState().stopRequested) {
        showToast('重新生成失败', 'error');
        addMessage('assistant', `⚠ ${e instanceof Error ? e.message : 'Error'}`);
      }
    }
    setIsStreaming(false);
  }, [chats, activeChatId, isStreaming, contextLength, model, addMessage, setIsStreaming, setStopRequested, showToast]);

  return (
    <div id="chat-area" ref={chatAreaRef}>
      <MessageList onRegenerate={handleRegenerate} />
    </div>
  );
}
