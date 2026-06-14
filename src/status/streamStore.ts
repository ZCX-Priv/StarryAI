import { create } from 'zustand';

interface StreamState {
  stopRequested: boolean;
  streamingText: string;
  autoScroll: boolean;
  streamingChatIds: Set<string>;
}

interface StreamActions {
  setStopRequested: (v: boolean) => void;
  setStreamingText: (text: string) => void;
  setAutoScroll: (v: boolean) => void;
  addStreamingChat: (id: string) => void;
  removeStreamingChat: (id: string) => void;
  clearStreamingChats: () => void;
}

type StreamStore = StreamState & StreamActions;

const useStreamStore = create<StreamStore>((set) => ({
  stopRequested: false,
  streamingText: '',
  autoScroll: true,
  streamingChatIds: new Set<string>(),

  setStopRequested: (v) => set({ stopRequested: v }),
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
    return { streamingChatIds: next };
  }),
  clearStreamingChats: () => set({ streamingChatIds: new Set<string>() }),
}));

export default useStreamStore;
