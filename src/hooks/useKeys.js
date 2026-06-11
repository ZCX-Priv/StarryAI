import { useCallback } from 'react';
import useAppStore from '@/store/useAppStore';
import { IDBStore } from '@/services/storage';
import { API } from '@/services/api';

export default function useKeys() {
  const keys = useAppStore(s => s.keys);
  const activeKey = useAppStore(s => s.activeKey);

  const add = useCallback(async (key) => {
    const trimmed = key.trim();
    if (!trimmed) return;
    const store = useAppStore.getState();
    if (!store.keys.includes(trimmed)) {
      store.addKey(trimmed);
      await IDBStore.setKeys(useAppStore.getState().keys);
    }
  }, []);

  const activate = useCallback(async (key) => {
    useAppStore.getState().activateKey(key);
    await IDBStore.setActiveKey(key);
  }, []);

  const deleteKey = useCallback(async (key) => {
    useAppStore.getState().deleteKey(key);
    const store = useAppStore.getState();
    await IDBStore.setKeys(store.keys);
    await IDBStore.setActiveKey(store.activeKey || '');
  }, []);

  const validateKey = useCallback(async (key) => {
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
