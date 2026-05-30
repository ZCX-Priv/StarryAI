/* ─── IndexedDB 存储管理 ────────────────────────────────── */
const IDBStore = {
  DB_NAME: 'AIChatDB',
  DB_VERSION: 1,
  db: null,
  STORES: {
    CONFIG: 'config',
    CHATS: 'chats',
    MEMORY: 'memory',
    KEYS: 'keys',
    AGENTS: 'agents'
  },

  async init() {
    if (this.db) return this.db;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      
      request.onerror = () => {
        console.error('IndexedDB 初始化失败:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains(this.STORES.CONFIG)) {
          db.createObjectStore(this.STORES.CONFIG, { keyPath: 'key' });
        }
        
        if (!db.objectStoreNames.contains(this.STORES.CHATS)) {
          db.createObjectStore(this.STORES.CHATS, { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains(this.STORES.MEMORY)) {
          db.createObjectStore(this.STORES.MEMORY, { keyPath: 'key' });
        }
        
        if (!db.objectStoreNames.contains(this.STORES.KEYS)) {
          db.createObjectStore(this.STORES.KEYS, { keyPath: 'key' });
        }
        
        if (!db.objectStoreNames.contains(this.STORES.AGENTS)) {
          db.createObjectStore(this.STORES.AGENTS, { keyPath: 'key' });
        }
      };
    });
  },

  async get(storeName, key) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      
      request.onsuccess = () => {
        resolve(request.result?.value ?? null);
      };
      
      request.onerror = () => {
        console.error(`IDBStore.get 失败 [${storeName}/${key}]:`, request.error);
        reject(request.error);
      };
    });
  },

  async getAll(storeName) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => {
        const results = request.result || [];
        if (storeName === this.STORES.CHATS) {
          resolve(results);
        } else {
          resolve(results.map(item => item.value));
        }
      };
      
      request.onerror = () => {
        console.error(`IDBStore.getAll 失败 [${storeName}]:`, request.error);
        reject(request.error);
      };
    });
  },

  async set(storeName, key, value) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      
      let data;
      if (storeName === this.STORES.CHATS) {
        data = value;
      } else {
        data = { key, value };
      }
      
      const request = store.put(data);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        console.error(`IDBStore.set 失败 [${storeName}/${key}]:`, request.error);
        reject(request.error);
      };
    });
  },

  async delete(storeName, key) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        console.error(`IDBStore.delete 失败 [${storeName}/${key}]:`, request.error);
        reject(request.error);
      };
    });
  },

  async clear(storeName) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        console.error(`IDBStore.clear 失败 [${storeName}]:`, request.error);
        reject(request.error);
      };
    });
  },

  async batchSet(storeName, items) {
    await this.init();
    
    const results = await Promise.allSettled(
      items.map(item => this.set(storeName, item.key, item.value))
    );
    
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`batchSet 第 ${index} 项失败:`, result.reason);
      }
    });
  },

  async getAllChats() {
    return this.getAll(this.STORES.CHATS);
  },

  async saveChat(chat) {
    return this.set(this.STORES.CHATS, chat.id, chat);
  },

  async deleteChat(chatId) {
    return this.delete(this.STORES.CHATS, chatId);
  },

  async getConfig(key) {
    return this.get(this.STORES.CONFIG, key);
  },

  async setConfig(key, value) {
    return this.set(this.STORES.CONFIG, key, value);
  },

  async getMemory() {
    const memory = await this.get(this.STORES.MEMORY, 'data');
    return memory || [];
  },

  async setMemory(memoryArray) {
    return this.set(this.STORES.MEMORY, 'data', memoryArray);
  },

  async getKeys() {
    const keys = await this.get(this.STORES.KEYS, 'list');
    return keys || [];
  },

  async setKeys(keysArray) {
    return this.set(this.STORES.KEYS, 'list', keysArray);
  },

  async getActiveKey() {
    return this.get(this.STORES.KEYS, 'active');
  },

  async setActiveKey(key) {
    return this.set(this.STORES.KEYS, 'active', key);
  },

  async getAgentConfig(key) {
    return this.get(this.STORES.AGENTS, key);
  },

  async setAgentConfig(key, value) {
    return this.set(this.STORES.AGENTS, key, value);
  }
};
