import { useCallback } from 'react';
import { useChatStore, useModelStore, useAgentStore, useUiStore } from '@/status';
import { IDBStore } from '@/services/storage';
import type { Chat, MessageStatus } from '@/types';

export default function useChats() {
  const chats = useChatStore(s => s.chats);
  const activeChatId = useChatStore(s => s.activeChatId);

  const createChat = useCallback(async (): Promise<Chat> => {
    const chat = useChatStore.getState().createChat();
    await IDBStore.saveChat(chat);
    await IDBStore.setConfig('activeChatId', chat.id);
    return chat;
  }, []);

  const addMessage = useCallback(async (role: 'system' | 'user' | 'assistant', content: string, chatId?: string, status?: MessageStatus): Promise<string> => {
    const msgId = useChatStore.getState().addMessage(role, content, chatId, status);
    const targetId = chatId || useChatStore.getState().activeChatId;
    const chat = useChatStore.getState().chats.find(c => c.id === targetId);
    if (chat) await IDBStore.saveChat(chat);
    return msgId;
  }, []);

  const updateMessageContent = useCallback((chatId: string, messageId: string, content: string) => {
    useChatStore.getState().updateMessageContent(chatId, messageId, content);
    const chat = useChatStore.getState().chats.find(c => c.id === chatId);
    if (chat) {
      IDBStore.saveChat(chat).catch(() => {});
    }
  }, []);

  const setMessageStatus = useCallback(async (chatId: string, messageId: string, status: MessageStatus): Promise<void> => {
    useChatStore.getState().setMessageStatus(chatId, messageId, status);
    const chat = useChatStore.getState().chats.find(c => c.id === chatId);
    if (chat) await IDBStore.saveChat(chat);
  }, []);

  const stopMessage = useCallback((chatId: string, messageId: string) => {
    useChatStore.getState().stopMessage(chatId, messageId);
  }, []);

  const deleteChat = useCallback(async (chatId: string): Promise<void> => {
    const { activeChatId: newActiveId } = useChatStore.getState().deleteChat(chatId);
    await IDBStore.deleteChat(chatId);
    await IDBStore.setConfig('activeChatId', newActiveId || '');
  }, []);

  const renameChat = useCallback(async (chatId: string, newTitle: string): Promise<void> => {
    useChatStore.getState().renameChat(chatId, newTitle);
    const chat = useChatStore.getState().chats.find(c => c.id === chatId);
    if (chat) await IDBStore.saveChat(chat);
  }, []);

  const switchToChat = useCallback(async (id: string): Promise<void> => {
    useChatStore.getState().switchToChat(id);
    await IDBStore.setConfig('activeChatId', id);
  }, []);

  const setMessageError = useCallback(async (chatId: string, messageId: string, errorInfo: string): Promise<void> => {
    useChatStore.setState({
      chats: useChatStore.getState().chats.map(c =>
        c.id === chatId
          ? {
              ...c,
              messages: c.messages.map(m =>
                m.id === messageId ? { ...m, content: '', errorInfo, status: 'error' as const } : m
              ),
            }
          : c
      ),
    });
    const chat = useChatStore.getState().chats.find(c => c.id === chatId);
    if (chat) await IDBStore.saveChat(chat);
  }, []);

  const saveChat = useCallback(async (chat: Chat): Promise<void> => {
    await IDBStore.saveChat(chat);
  }, []);

  return {
    chats,
    activeChatId,
    createChat,
    addMessage,
    updateMessageContent,
    setMessageStatus,
    stopMessage,
    deleteChat,
    renameChat,
    switchToChat,
    saveChat,
    setMessageError,
  };
}
