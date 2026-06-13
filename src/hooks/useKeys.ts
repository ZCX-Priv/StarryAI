import { useCallback } from 'react';
import { useKeyStore } from '@/status';
import { IDBStore } from '@/services/storage';
import { API } from '@/services/api';

export default function useKeys() {
  const keys = useKeyStore(s => s.keys);
  const activeKey = useKeyStore(s => s.activeKey);

  const add = useCallback(async (key: string): Promise<void> => {
    const trimmed = key.trim();
    if (!trimmed) return;
    const store = useKeyStore.getState();
    if (!store.keys.includes(trimmed)) {
      store.addKey(trimmed);
      await IDBStore.setKeys(useKeyStore.getState().keys);
    }
  }, []);

  const activate = useCallback(async (key: string): Promise<void> => {
    useKeyStore.getState().activateKey(key);
    await IDBStore.setActiveKey(key);
  }, []);

  const deleteKey = useCallback(async (key: string): Promise<void> => {
    useKeyStore.getState().deleteKey(key);
    const store = useKeyStore.getState();
    await IDBStore.setKeys(store.keys);
    await IDBStore.setActiveKey(store.activeKey || '');
  }, []);

  const validateKey = useCallback(async (key: string): Promise<boolean> => {
    return await API.validateKey(key);
  }, []);

  return {
    keys,
    activeKey,
    add,
    activate,
    delete: deleteKey,
    validateKey,
  };
}
