import { create } from 'zustand';

const useStreamStore = create((set) => ({
  isStreaming: false,
  stopRequested: false,
  streamingText: '',
  autoScroll: true,

  setIsStreaming: (v) => set({ isStreaming: v }),
  setStopRequested: (v) => set({ stopRequested: v }),
  setStreamingText: (text) => set({ streamingText: text }),
  setAutoScroll: (v) => set({ autoScroll: v }),
}));

export default useStreamStore;
