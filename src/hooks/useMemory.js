import { useCallback } from 'react';
import useAppStore from '@/store/useAppStore';
import { extractMemory, deduplicateMemory, clearMemory, editMemoryItem, deleteMemoryItem } from '@/context/index';

export default function useMemory() {
  const memory = useAppStore(s => s.memory);

  const extract = useCallback(async (recentMsgs) => {
    await extractMemory(recentMsgs);
  }, []);

  const deduplicate = useCallback(async () => {
    await deduplicateMemory();
  }, []);

  const clear = useCallback(async () => {
    await clearMemory();
  }, []);

  const edit = useCallback(async (index, value) => {
    await editMemoryItem(index, value);
  }, []);

  const deleteItem = useCallback(async (index) => {
    await deleteMemoryItem(index);
  }, []);

  return {
    memory,
    extract,
    deduplicate,
    clear,
    edit,
    delete: deleteItem,
  };
}
