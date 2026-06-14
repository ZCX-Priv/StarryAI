import { create } from 'zustand';

interface StreamState {
  stopRequestedChatIds: Set<string>;
  streamingText: string;
  autoScroll: boolean;
  streamingChatIds: Set<string>;
}

interface StreamActions {
  setStopRequested: (chatId: string, v: boolean) => void;
  isStopRequested: (chatId: string) => boolean;
  setStreamingText: (text: string) => void;
  setAutoScroll: (v: boolean) => void;
  addStreamingChat: (id: string) => void;
  removeStreamingChat: (id: string) => void;
  clearStreamingChats: () => void;
}

type StreamStore = StreamState & StreamActions;

const useStreamStore = create<StreamStore>((set, get) => ({
  stopRequestedChatIds: new Set<string>(),
  streamingText: '',
  autoScroll: true,
  streamingChatIds: new Set<string>(),

  setStopRequested: (chatId, v) => set((s) => {
    const next = new Set(s.stopRequestedChatIds);
    if (v) next.add(chatId);
    else next.delete(chatId);
    return { stopRequestedChatIds: next };
  }),
  isStopRequested: (chatId) => get().stopRequestedChatIds.has(chatId),
  setStreamingText: (text) => set({ streamingText: text }),
  setAutoScroll: (v) => set({ autoScroll: v }),
  addStreamingChat: (id) => set((s) => {
    const next = new Set(s.streamingChatIds);
    next.add(id);
    return { streamingChatIds: next };
  }),
  removeStreamingChat: (id) => set((s) => {
    const next = new Set(s.streamingChatIds);
    next.delete(id);
    const stopNext = new Set(s.stopRequestedChatIds);
    stopNext.delete(id);
    return { streamingChatIds: next, stopRequestedChatIds: stopNext };
  }),
  clearStreamingChats: () => set({ streamingChatIds: new Set<string>(), stopRequestedChatIds: new Set<string>() }),
}));

export default useStreamStore;
