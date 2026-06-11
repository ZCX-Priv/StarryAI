import { useCallback } from 'react';
import useAppStore from '@/store/useAppStore';
import { IDBStore } from '@/services/storage';
import { API } from '@/services/api';
import { buildMessages } from '@/context/index';
import { extractMemory } from '@/context/index';

export default function useChat() {
  const chats = useAppStore(s => s.chats);
  const activeChatId = useAppStore(s => s.activeChatId);
  const isStreaming = useAppStore(s => s.isStreaming);
  const model = useAppStore(s => s.model);
  const currentMode = useAppStore(s => s.currentMode);
  const modeConfig = useAppStore(s => s.modeConfig);
  const contextLength = useAppStore(s => s.contextLength);

  const getActiveChat = useCallback(() => {
    return useAppStore.getState().chats.find(c => c.id === useAppStore.getState().activeChatId);
  }, []);

  const create = useCallback(() => {
    const store = useAppStore.getState();
    const chat = store.createChat();
    IDBStore.setConfig('activeChatId', chat.id);
    // Save all chats to IDB
    Promise.all(store.chats.map(c => IDBStore.saveChat(c)));
    return chat;
  }, []);

  const switchTo = useCallback((id) => {
    useAppStore.getState().switchToChat(id);
    IDBStore.setConfig('activeChatId', id);
  }, []);

  const deleteChat = useCallback(async (id) => {
    const result = useAppStore.getState().deleteChat(id);
    await IDBStore.deleteChat(id);
    await IDBStore.setConfig('activeChatId', result.activeChatId || '');
    // Save remaining chats
    await Promise.all(result.chats.map(c => IDBStore.saveChat(c)));
  }, []);

  const rename = useCallback(async (chatId, newTitle) => {
    useAppStore.getState().renameChat(chatId, newTitle);
    const chat = useAppStore.getState().chats.find(c => c.id === chatId);
    if (chat) await IDBStore.saveChat(chat);
  }, []);

  const send = useCallback(async (text) => {
    const store = useAppStore.getState();
    if (!text || store.isStreaming) return;

    let activeId = store.activeChatId;
    if (!activeId) {
      const chat = store.createChat();
      activeId = chat.id;
      IDBStore.setConfig('activeChatId', activeId);
    }

    store.addMessage('user', text);
    const chat = useAppStore.getState().chats.find(c => c.id === activeId);
    if (chat) await IDBStore.saveChat(chat);

    await _streamResponse();
  }, []);

  const _streamResponse = useCallback(async () => {
    const store = useAppStore.getState();
    const chat = store.chats.find(c => c.id === store.activeChatId);
    if (!chat) return;

    const allMsgs = chat.messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role, content: m.content }));
    const msgs = store.contextLength > 0 ? allMsgs.slice(-store.contextLength) : [];
    const builtMsgs = buildMessages(msgs);

    let modelToUse = chat.model || store.model;
    if (store.currentMode === 'expert' && store.modeConfig.expert?.model) {
      modelToUse = store.modeConfig.expert.model;
    }

    store.setIsStreaming(true);
    store.setStopRequested(false);
    store.setAutoScroll(true);

    let fullResp = '';
    let streamFailed = false;

    try {
      let first = true;
      for await (const chunk of API.stream(builtMsgs, modelToUse)) {
        if (first) { first = false; }
        fullResp += chunk;
        // Update streaming text in store for UI
        useAppStore.getState().setStreamingText(fullResp);
        if (useAppStore.getState().stopRequested) break;
      }
      if (first && !useAppStore.getState().stopRequested) { streamFailed = true; }
    } catch {
      streamFailed = !useAppStore.getState().stopRequested;
    }

    if (useAppStore.getState().stopRequested) {
      if (fullResp) {
        useAppStore.getState().addMessage('assistant', fullResp);
        const updatedChat = useAppStore.getState().chats.find(c => c.id === useAppStore.getState().activeChatId);
        if (updatedChat) await IDBStore.saveChat(updatedChat);
      }
      useAppStore.getState().setIsStreaming(false);
      useAppStore.getState().setStreamingText('');
      return;
    }

    if (streamFailed && !fullResp) {
      try {
        const result = await API.fetch(builtMsgs, modelToUse);
        if (result) fullResp = result;
      } catch (e) {
        useAppStore.getState().addMessage('assistant', `⚠ ${e?.message || 'Error'}`);
        useAppStore.getState().setIsStreaming(false);
        useAppStore.getState().setStreamingText('');
        return;
      }
    }

    if (fullResp) {
      useAppStore.getState().addMessage('assistant', fullResp);
      const updatedChat = useAppStore.getState().chats.find(c => c.id === useAppStore.getState().activeChatId);
      if (updatedChat) await IDBStore.saveChat(updatedChat);

      // Trigger memory extraction
      extractMemory(updatedChat.messages.slice(-6));
    }

    useAppStore.getState().setIsStreaming(false);
    useAppStore.getState().setStreamingText('');
  }, []);

  const regenerate = useCallback(async () => {
    const store = useAppStore.getState();
    const chat = store.chats.find(c => c.id === store.activeChatId);
    if (!chat || store.isStreaming) return;

    // Remove last assistant message
    if (chat.messages[chat.messages.length - 1]?.role === 'assistant') {
      chat.messages.pop();
      useAppStore.getState().setChats([...useAppStore.getState().chats]);
      await IDBStore.saveChat(chat);
    }

    const allMsgs = chat.messages.map(m => ({ role: m.role, content: m.content }));
    const msgs = store.contextLength > 0 ? allMsgs.slice(-store.contextLength) : [];
    const builtMsgs = buildMessages(msgs);
    const modelToUse = chat.model || store.model;

    store.setIsStreaming(true);
    store.setStopRequested(false);
    store.setAutoScroll(true);

    let fullResp = '';

    try {
      for await (const chunk of API.stream(builtMsgs, modelToUse)) {
        fullResp += chunk;
        useAppStore.getState().setStreamingText(fullResp);
        if (useAppStore.getState().stopRequested) break;
      }
    } catch (e) {
      useAppStore.getState().addMessage('assistant', `⚠ ${e?.message || 'Error'}`);
    }

    if (fullResp) {
      useAppStore.getState().addMessage('assistant', fullResp);
      const updatedChat = useAppStore.getState().chats.find(c => c.id === useAppStore.getState().activeChatId);
      if (updatedChat) await IDBStore.saveChat(updatedChat);
    }

    useAppStore.getState().setIsStreaming(false);
    useAppStore.getState().setStreamingText('');
  }, []);

  const copyLastResponse = useCallback(async () => {
    const chat = useAppStore.getState().chats.find(c => c.id === useAppStore.getState().activeChatId);
    if (!chat) return;
    const last = [...chat.messages].reverse().find(m => m.role === 'assistant');
    if (!last) return;
    try { await navigator.clipboard.writeText(last.content); } catch {}
  }, []);

  const stopGeneration = useCallback(() => {
    useAppStore.getState().setStopRequested(true);
    useAppStore.getState().setIsStreaming(false);
  }, []);

  return {
    chats,
    activeChatId,
    isStreaming,
    getActiveChat,
    create,
    switchTo,
    delete: deleteChat,
    rename,
    send,
    regenerate,
    copyLastResponse,
    stopGeneration,
  };
}
