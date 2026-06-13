import { create } from 'zustand';

interface StreamState {
  isStreaming: boolean;
  stopRequested: boolean;
  streamingText: string;
  autoScroll: boolean;
  streamingChatId: string | null;
}

interface StreamActions {
  setIsStreaming: (v: boolean) => void;
  setStopRequested: (v: boolean) => void;
  setStreamingText: (text: string) => void;
  setAutoScroll: (v: boolean) => void;
  setStreamingChatId: (id: string | null) => void;
}

type StreamStore = StreamState & StreamActions;

const useStreamStore = create<StreamStore>((set) => ({
  isStreaming: false,
  stopRequested: false,
  streamingText: '',
  autoScroll: true,
  streamingChatId: null,

  setIsStreaming: (v) => set({ isStreaming: v }),
  setStopRequested: (v) => set({ stopRequested: v }),
  setStreamingText: (text) => set({ streamingText: text }),
  setAutoScroll: (v) => set({ autoScroll: v }),
  setStreamingChatId: (id) => set({ streamingChatId: id }),
}));

export default useStreamStore;
