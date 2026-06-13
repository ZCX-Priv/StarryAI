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
  addMessage: (role: Message['role'], content: string) => void;
  renameChat: (chatId: string, newTitle: string) => void;
}

type ChatStore = ChatState & ChatActions;

const useChatStore = create<ChatStore>((set, get) => ({
  chats: [],
  activeChatId: null,

  setChats: (chats) => set({ chats }),
  setActiveChatId: (id) => set({ activeChatId: id }),

  createChat: () => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
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

  addMessage: (role, content) => {
    const chat = get().chats.find(c => c.id === get().activeChatId);
    if (!chat) return;
    chat.messages.push({ role, content, rendered: content, ts: Date.now() });
    if (chat.messages.length === 1 && role === 'user') {
      chat.title = content.slice(0, 20) + (content.length > 20 ? '…' : '');
    }
    set({ chats: [...get().chats] });
  },

  renameChat: (chatId, newTitle) => {
    const chat = get().chats.find(c => c.id === chatId);
    if (chat) {
      chat.title = newTitle || '新对话';
      set({ chats: [...get().chats] });
    }
  },
}));

export default useChatStore;
