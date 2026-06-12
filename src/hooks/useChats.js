import { useCallback } from 'react';
import { useChatStore, useModelStore, useAgentStore, useUiStore } from '@/status';
import { IDBStore } from '@/services/storage';

export default function useChats() {
  const chats = useChatStore(s => s.chats);
  const activeChatId = useChatStore(s => s.activeChatId);

  const createChat = useCallback(async () => {
    const chat = useChatStore.getState().createChat();
    await IDBStore.saveChat(chat);
    await IDBStore.setConfig('activeChatId', chat.id);
    return chat;
  }, []);

  const addMessage = useCallback(async (role, content) => {
    useChatStore.getState().addMessage(role, content);
    const chat = useChatStore.getState().chats.find(c => c.id === useChatStore.getState().activeChatId);
    if (chat) await IDBStore.saveChat(chat);
  }, []);

  const deleteChat = useCallback(async (chatId) => {
    const { activeChatId: newActiveId } = useChatStore.getState().deleteChat(chatId);
    await IDBStore.deleteChat(chatId);
    await IDBStore.setConfig('activeChatId', newActiveId || '');
  }, []);

  const renameChat = useCallback(async (chatId, newTitle) => {
    useChatStore.getState().renameChat(chatId, newTitle);
    const chat = useChatStore.getState().chats.find(c => c.id === chatId);
    if (chat) await IDBStore.saveChat(chat);
  }, []);

  const switchToChat = useCallback(async (id) => {
    useChatStore.getState().switchToChat(id);
    await IDBStore.setConfig('activeChatId', id);
  }, []);

  const saveChat = useCallback(async (chat) => {
    await IDBStore.saveChat(chat);
  }, []);

  return {
    chats,
    activeChatId,
    createChat,
    addMessage,
    deleteChat,
    renameChat,
    switchToChat,
    saveChat,
  };
}
