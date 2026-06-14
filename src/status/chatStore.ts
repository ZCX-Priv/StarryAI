import { create } from 'zustand';
import useModelStore from './modelStore';
import useAgentStore from './agentStore';
import useUiStore from './uiStore';
import type { Chat, Message } from '@/types';

interface ChatState {
  chats: Chat[];
  activeChatId: string | null;
}

interface ChatActions {
  setChats: (chats: Chat[]) => void;
  setActiveChatId: (id: string | null) => void;
  createChat: () => Chat;
  switchToChat: (id: string) => void;
  deleteChat: (id: string) => { chats: Chat[]; activeChatId: string | null };
  addMessage: (role: Message['role'], content: string, chatId?: string) => string;
  updateMessageContent: (chatId: string, messageId: string, content: string) => void;
  stopMessage: (chatId: string, messageId: string) => void;
  renameChat: (chatId: string, newTitle: string) => void;
}

type ChatStore = ChatState & ChatActions;

const useChatStore = create<ChatStore>((set, get) => ({
  chats: [],
  activeChatId: null,

  setChats: (chats) => set({ chats }),
  setActiveChatId: (id) => set({ activeChatId: id }),

  createChat: () => {
    const id = crypto.randomUUID();
    const chat: Chat = {
      id,
      title: '新对话',
      messages: [],
      createdAt: Date.now(),
      model: useModelStore.getState().model,
      agentId: useAgentStore.getState().currentAgentId,
    };
    const chats = [chat, ...get().chats];
    set({ chats, activeChatId: chat.id });
    useUiStore.getState().setCurrentPage('chat');
    return chat;
  },

  switchToChat: (id) => {
    set({ activeChatId: id });
    useUiStore.getState().setCurrentPage('chat');
  },

  deleteChat: (id) => {
    const chats = get().chats.filter(c => c.id !== id);
    let activeChatId = get().activeChatId;
    if (activeChatId === id) {
      activeChatId = chats[0]?.id || null;
    }
    set({ chats, activeChatId });
    return { chats, activeChatId };
  },

  addMessage: (role, content, chatId) => {
    const targetId = chatId || get().activeChatId;
    if (!targetId) return '';
    const newMsg: Message = {
      id: crypto.randomUUID(),
      role,
      content,
      rendered: content,
      ts: Date.now(),
    };
    set({
      chats: get().chats.map(c =>
        c.id === targetId
          ? {
              ...c,
              messages: [...c.messages, newMsg],
              title: c.messages.length === 0 && role === 'user'
                ? content.slice(0, 20) + (content.length > 20 ? '…' : '')
                : c.title,
            }
          : c
      ),
    });
    return newMsg.id;
  },

  updateMessageContent: (chatId, messageId, content) => {
    set({
      chats: get().chats.map(c =>
        c.id === chatId
          ? {
              ...c,
              messages: c.messages.map(m =>
                m.id === messageId ? { ...m, content, rendered: content } : m
              ),
            }
          : c
      ),
    });
  },

  stopMessage: (chatId, messageId) => {
    set({
      chats: get().chats.map(c =>
        c.id === chatId
          ? {
              ...c,
              messages: c.messages.map(m =>
                m.id === messageId ? { ...m, stopped: true } : m
              ),
            }
          : c
      ),
    });
  },

  renameChat: (chatId, newTitle) => {
    set({
      chats: get().chats.map(c =>
        c.id === chatId ? { ...c, title: newTitle || '新对话' } : c
      ),
    });
  },
}));

export default useChatStore;
