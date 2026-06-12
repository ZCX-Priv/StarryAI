import { useRef, useEffect, useCallback } from 'react';
import { useStreamStore } from '@/status';

export function useScroll(chatAreaRef) {
  const autoScroll = useStreamStore(s => s.autoScroll);
  const setAutoScroll = useStreamStore(s => s.setAutoScroll);

  const pinToBottom = useCallback((area) => {
    if (!area) return;
    area.scrollTop = area.scrollHeight;
  }, []);

  const scrollToBottom = useCallback((force = true) => {
    const area = chatAreaRef?.current;
    if (!area) return;
    if (force) setAutoScroll(true);
    area.scrollTo({ top: area.scrollHeight, behavior: force ? 'smooth' : 'auto' });
    pinToBottom(area);
    requestAnimationFrame(() => pinToBottom(area));
  }, [chatAreaRef, setAutoScroll, pinToBottom]);

  const maybeScroll = useCallback(() => {
    if (useStreamStore.getState().autoScroll) {
      const area = chatAreaRef?.current;
      if (!area) return;
      pinToBottom(area);
      requestAnimationFrame(() => {
        if (useStreamStore.getState().autoScroll) pinToBottom(area);
      });
    }
  }, [chatAreaRef, pinToBottom]);

  useEffect(() => {
    const area = chatAreaRef?.current;
    if (!area) return;
    let tick = false;
    const handler = () => {
      if (tick) return;
      tick = true;
      requestAnimationFrame(() => {
        tick = false;
        const a = chatAreaRef?.current;
        if (!a) return;
        const atBottom = (a.scrollHeight - a.scrollTop - a.clientHeight) < 60;
        setAutoScroll(atBottom);
      });
    };
    area.addEventListener('scroll', handler, { passive: true });
    return () => area.removeEventListener('scroll', handler);
  }, [chatAreaRef, setAutoScroll]);

  return { scrollToBottom, maybeScroll, autoScroll };
}
