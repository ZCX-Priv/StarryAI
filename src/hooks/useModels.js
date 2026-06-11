import { useCallback } from 'react';
import useAppStore from '@/store/useAppStore';
import { IDBStore } from '@/services/storage';
import { API } from '@/services/api';

export default function useModels() {
  const models = useAppStore(s => s.models);
  const model = useAppStore(s => s.model);

  const loadModels = useCallback(async () => {
    const loadedModels = await API.loadModels();
    if (loadedModels && loadedModels.length > 0) {
      useAppStore.getState().setModels(loadedModels);
      const currentModel = useAppStore.getState().model;
      if (!loadedModels.find(m => m.id === currentModel)) {
        useAppStore.getState().setModel(loadedModels[0]?.id || 'nova-fast');
        await IDBStore.setConfig('model', loadedModels[0]?.id || 'nova-fast');
      }
    }
    return loadedModels;
  }, []);

  const filterModels = useCallback((searchTerm) => {
    if (!searchTerm) return useAppStore.getState().models;
    const term = searchTerm.toLowerCase();
    return useAppStore.getState().models.filter(m =>
      m.id.toLowerCase().includes(term) ||
      m.label.toLowerCase().includes(term)
    );
  }, []);

  const setModel = useCallback(async (id) => {
    useAppStore.getState().setModel(id);
    await IDBStore.setConfig('model', id);
  }, []);

  const setModelAndUpdate = useCallback(async (id) => {
    useAppStore.getState().setModel(id);
    await IDBStore.setConfig('model', id);

    // Update active chat model
    const store = useAppStore.getState();
    const chat = store.chats.find(c => c.id === store.activeChatId);
    if (chat) {
      chat.model = id;
      store.setChats([...store.chats]);
      await IDBStore.saveChat(chat);
    }
  }, []);

  return {
    models,
    model,
    loadModels,
    filterModels,
    setModel,
    setModelAndUpdate,
  };
}
