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
  const streamingChatIds = useStreamStore(s => s.streamingChatIds);
  const activeChatId = useChatStore(s => s.activeChatId);
  const isStreamingThisChat = activeChatId !== null && streamingChatIds.has(activeChatId);
  const chats = useChatStore(s => s.chats);
  const model = useModelStore(s => s.model);
  const contextLength = useModelStore(s => s.contextLength);
  const currentMode = useModeStore(s => s.currentMode);
  const modeConfig = useModeStore(s => s.modeConfig);
  const setStopRequested = useStreamStore(s => s.setStopRequested);
  const addStreamingChat = useStreamStore(s => s.addStreamingChat);
  const removeStreamingChat = useStreamStore(s => s.removeStreamingChat);
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
    const chatId = activeChatId;
    const chat = chats.find(c => c.id === chatId);
    if (!chat || !chatId || isStreamingThisChat) return;

    let msgs = chat.messages;
    if (msgs[msgs.length - 1]?.role === 'assistant') {
      msgs = msgs.slice(0, -1);
      useChatStore.setState({
        chats: useChatStore.getState().chats.map(c =>
          c.id === chatId ? { ...c, messages: msgs } : c
        ),
      });
      await saveChat({ ...chat, messages: msgs });
    }

    const msgsToSend = contextLength > 0 ? msgs.slice(-contextLength) : [];
    const modelToUse = chat.model || model;

    setStopRequested(false);
    addStreamingChat(chatId);

    let fullResp = '';
    try {
      for await (const chunk of API.stream(msgsToSend, modelToUse)) {
        if (useStreamStore.getState().stopRequested) break;
        fullResp += chunk;
      }
      if (fullResp) addMessage('assistant', fullResp, chatId);
    } catch (e: unknown) {
      if (!useStreamStore.getState().stopRequested) {
        showToast('重新生成失败', 'error');
        addMessage('assistant', `⚠ ${e instanceof Error ? e.message : 'Error'}`, chatId);
      }
    }
    if (useStreamStore.getState().streamingChatIds.has(chatId)) {
      removeStreamingChat(chatId);
    }
  }, [chats, activeChatId, contextLength, model, addMessage, setStopRequested, addStreamingChat, removeStreamingChat, showToast]);

  return (
    <div id="chat-area" ref={chatAreaRef}>
      <MessageList onRegenerate={handleRegenerate} />
    </div>
  );
}
