import { openDB } from 'idb';

const DB_NAME = 'AIChatDB';
const DB_VERSION = 1;

const STORES = {
  CONFIG: 'config',
  CHATS: 'chats',
  MEMORY: 'memory',
  KEYS: 'keys',
  AGENTS: 'agents',
};

let dbInstance = null;

async function initDB() {
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

async function get(storeName, key) {
  const db = await initDB();
  const result = await db.get(storeName, key);
  return result?.value ?? null;
}

async function getAll(storeName) {
  const db = await initDB();
  const results = await db.getAll(storeName);
  if (storeName === STORES.CHATS) return results;
  return results.map(item => item.value);
}

async function set(storeName, key, value) {
  const db = await initDB();
  const data = storeName === STORES.CHATS ? value : { key, value };
  await db.put(storeName, data);
}

async function deleteItem(storeName, key) {
  const db = await initDB();
  await db.delete(storeName, key);
}

async function clear(storeName) {
  const db = await initDB();
  await db.clear(storeName);
}

// High-level API
export const IDBStore = {
  init: initDB,
  get, getAll, set, delete: deleteItem, clear,

  getAllChats: () => getAll(STORES.CHATS),
  saveChat: (chat) => set(STORES.CHATS, chat.id, chat),
  deleteChat: (chatId) => deleteItem(STORES.CHATS, chatId),

  getConfig: (key) => get(STORES.CONFIG, key),
  setConfig: (key, value) => set(STORES.CONFIG, key, value),

  getMemory: async () => (await get(STORES.MEMORY, 'data')) || [],
  setMemory: (memoryArray) => set(STORES.MEMORY, 'data', memoryArray),

  getKeys: async () => (await get(STORES.KEYS, 'list')) || [],
  setKeys: (keysArray) => set(STORES.KEYS, 'list', keysArray),
  getActiveKey: () => get(STORES.KEYS, 'active'),
  setActiveKey: (key) => set(STORES.KEYS, 'active', key),

  getAgentConfig: (key) => get(STORES.AGENTS, key),
  setAgentConfig: (key, value) => set(STORES.AGENTS, key, value),
};

export { STORES };
