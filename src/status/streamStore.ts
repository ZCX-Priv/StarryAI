import { create } from 'zustand';

interface StreamState {
  stopRequested: boolean;
  streamingText: string;
  autoScroll: boolean;
  streamingChatId: string | null;
}

interface StreamActions {
  setStopRequested: (v: boolean) => void;
  setStreamingText: (text: string) => void;
  setAutoScroll: (v: boolean) => void;
  setStreamingChatId: (id: string | null) => void;
}

type StreamStore = StreamState & StreamActions;

const useStreamStore = create<StreamStore>((set) => ({
  stopRequested: false,
  streamingText: '',
  autoScroll: true,
  streamingChatId: null,

  setStopRequested: (v) => set({ stopRequested: v }),
  setStreamingText: (text) => set({ streamingText: text }),
  setAutoScroll: (v) => set({ autoScroll: v }),
  setStreamingChatId: (id) => set({ streamingChatId: id }),
}));

export default useStreamStore;
