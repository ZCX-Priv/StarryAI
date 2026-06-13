import { openDB } from 'idb';
import type { IDBPDatabase } from 'idb';
import type { Chat } from '@/types';

const DB_NAME = 'AIChatDB';
const DB_VERSION = 1;

const STORES = {
  CONFIG: 'config',
  CHATS: 'chats',
  MEMORY: 'memory',
  KEYS: 'keys',
  AGENTS: 'agents',
} as const;

type StoreName = typeof STORES[keyof typeof STORES];

let dbInstance: IDBPDatabase | null = null;

async function initDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance;
  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORES.CONFIG)) db.createObjectStore(STORES.CONFIG, { keyPath: 'key' });
      if (!db.objectStoreNames.contains(STORES.CHATS)) db.createObjectStore(STORES.CHATS, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(STORES.MEMORY)) db.createObjectStore(STORES.MEMORY, { keyPath: 'key' });
      if (!db.objectStoreNames.contains(STORES.KEYS)) db.createObjectStore(STORES.KEYS, { keyPath: 'key' });
      if (!db.objectStoreNames.contains(STORES.AGENTS)) db.createObjectStore(STORES.AGENTS, { keyPath: 'key' });
    },
  });
  return dbInstance;
}

async function get(storeName: StoreName, key: string): Promise<unknown> {
  const db = await initDB();
  const result = await db.get(storeName, key);
  return result?.value ?? null;
}

async function getAll(storeName: StoreName): Promise<unknown[]> {
  const db = await initDB();
  const results = await db.getAll(storeName);
  if (storeName === STORES.CHATS) return results;
  return results.map(item => item.value);
}

async function set(storeName: StoreName, key: string, value: unknown): Promise<void> {
  const db = await initDB();
  const data = storeName === STORES.CHATS ? value : { key, value };
  await db.put(storeName, data);
}

async function deleteItem(storeName: StoreName, key: string): Promise<void> {
  const db = await initDB();
  await db.delete(storeName, key);
}

async function clear(storeName: StoreName): Promise<void> {
  const db = await initDB();
  await db.clear(storeName);
}

export const IDBStore = {
  init: initDB,
  get, getAll, set, delete: deleteItem, clear,

  getAllChats: () => getAll(STORES.CHATS) as Promise<Chat[]>,
  saveChat: (chat: unknown) => set(STORES.CHATS, (chat as Chat).id, chat),
  deleteChat: (chatId: string) => deleteItem(STORES.CHATS, chatId),

  getConfig: (key: string) => get(STORES.CONFIG, key) as Promise<string | null>,
  setConfig: (key: string, value: unknown) => set(STORES.CONFIG, key, value),

  getMemory: async () => (await get(STORES.MEMORY, 'data')) as string[] || [],
  setMemory: (memoryArray: string[]) => set(STORES.MEMORY, 'data', memoryArray),

  getKeys: async () => (await get(STORES.KEYS, 'list')) as string[] || [],
  setKeys: (keysArray: string[]) => set(STORES.KEYS, 'list', keysArray),
  getActiveKey: () => get(STORES.KEYS, 'active') as Promise<string | null>,
  setActiveKey: (key: string) => set(STORES.KEYS, 'active', key),

  getAgentConfig: (key: string) => get(STORES.AGENTS, key),
  setAgentConfig: (key: string, value: unknown) => set(STORES.AGENTS, key, value),
};

export { STORES };
