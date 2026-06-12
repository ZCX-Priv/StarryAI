import { useCallback } from 'react';
import { useModelStore, useChatStore } from '@/status';
import { IDBStore } from '@/services/storage';
import { API } from '@/services/api';

export default function useModels() {
  const models = useModelStore(s => s.models);
  const model = useModelStore(s => s.model);

  const loadModels = useCallback(async () => {
    const loadedModels = await API.loadModels();
    if (loadedModels && loadedModels.length > 0) {
      useModelStore.getState().setModels(loadedModels);
      const currentModel = useModelStore.getState().model;
      if (!loadedModels.find(m => m.id === currentModel)) {
        useModelStore.getState().setModel(loadedModels[0]?.id || 'nova-fast');
        await IDBStore.setConfig('model', loadedModels[0]?.id || 'nova-fast');
      }
    }
    return loadedModels;
  }, []);

  const filterModels = useCallback((searchTerm) => {
    if (!searchTerm) return useModelStore.getState().models;
    const term = searchTerm.toLowerCase();
    return useModelStore.getState().models.filter(m =>
      m.id.toLowerCase().includes(term) ||
      m.label.toLowerCase().includes(term)
    );
  }, []);

  const setModel = useCallback(async (id) => {
    useModelStore.getState().setModel(id);
    await IDBStore.setConfig('model', id);
  }, []);

  const setModelAndUpdate = useCallback(async (id) => {
    useModelStore.getState().setModel(id);
    await IDBStore.setConfig('model', id);

    // Update active chat model
    const chatStore = useChatStore.getState();
    const chat = chatStore.chats.find(c => c.id === chatStore.activeChatId);
    if (chat) {
      chat.model = id;
      chatStore.setChats([...chatStore.chats]);
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
