import { useState, useRef, useCallback, useEffect } from 'react';
import useAppStore from '@/store/useAppStore';
import { API } from '@/services/api';
import MessageList from './MessageList';

export default function ChatArea({ onOpenModal, scrollBtnProps }) {
  const chatAreaRef = useRef(null);
  const autoScroll = useAppStore(s => s.autoScroll);
  const setAutoScroll = useAppStore(s => s.setAutoScroll);
  const isStreaming = useAppStore(s => s.isStreaming);
  const activeChatId = useAppStore(s => s.activeChatId);
  const chats = useAppStore(s => s.chats);
  const addMessage = useAppStore(s => s.addMessage);
  const model = useAppStore(s => s.model);
  const contextLength = useAppStore(s => s.contextLength);
  const currentMode = useAppStore(s => s.currentMode);
  const modeConfig = useAppStore(s => s.modeConfig);
  const setIsStreaming = useAppStore(s => s.setIsStreaming);
  const setStopRequested = useAppStore(s => s.setStopRequested);
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
      useAppStore.setState({ chats: [...useAppStore.getState().chats] });
    }

    const allMsgs = chat.messages.map(m => ({ role: m.role, content: m.content }));
    const msgs = contextLength > 0 ? allMsgs.slice(-contextLength) : [];
    const modelToUse = chat.model || model;

    setIsStreaming(true);
    setStopRequested(false);
    let fullResp = '';
    try {
      for await (const chunk of API.stream(msgs, modelToUse)) {
        if (useAppStore.getState().stopRequested) break;
        fullResp += chunk;
      }
      if (fullResp) addMessage('assistant', fullResp);
    } catch (e) {
      if (!useAppStore.getState().stopRequested) {
        addMessage('assistant', `⚠ ${e?.message || 'Error'}`);
      }
    }
    setIsStreaming(false);
  }, [chats, activeChatId, isStreaming, contextLength, model, addMessage, setIsStreaming, setStopRequested]);

  return (
    <div id="chat-area" ref={chatAreaRef}>
      <MessageList onRegenerate={handleRegenerate} />
    </div>
  );
}
