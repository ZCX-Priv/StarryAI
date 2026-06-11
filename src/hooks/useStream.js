import { useCallback } from 'react';
import useAppStore from '@/store/useAppStore';

export default function useStream() {
  const streamingText = useAppStore(s => s.streamingText);
  const isStreaming = useAppStore(s => s.isStreaming);
  const stopRequested = useAppStore(s => s.stopRequested);

  const startStream = useCallback(() => {
    useAppStore.getState().setIsStreaming(true);
    useAppStore.getState().setStopRequested(false);
    useAppStore.getState().setStreamingText('');
  }, []);

  const stopStream = useCallback(() => {
    useAppStore.getState().setStopRequested(true);
    useAppStore.getState().setIsStreaming(false);
  }, []);

  const updateStreamText = useCallback((text) => {
    useAppStore.getState().setStreamingText(text);
  }, []);

  return {
    streamingText,
    isStreaming,
    stopRequested,
    startStream,
    stopStream,
    updateStreamText,
  };
}
