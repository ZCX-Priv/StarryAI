import { IDBStore } from './storage';
import { KEYS_MAP } from '@/lib/config';

const MIGRATION_KEY = 'aichat_idb_migrated';
const MIGRATION_VERSION = 1;

interface MigrationResult {
  success: boolean;
  skipped?: boolean;
  items: Record<string, { status: string; total?: number; count?: number; reason?: string }>;
  errors: string[];
  error?: string;
}

async function isMigrated(): Promise<boolean> {
  const migrated = localStorage.getItem(MIGRATION_KEY);
  if (!migrated) return false;
  try {
    const data = JSON.parse(migrated);
    return data.version === MIGRATION_VERSION;
  } catch {
    return false;
  }
}

async function run(): Promise<MigrationResult> {
  if (await isMigrated()) {
    console.log('数据已迁移，跳过');
    return { success: true, skipped: true, items: {}, errors: [] };
  }

  console.log('开始迁移 localStorage 数据到 IndexedDB...');
  const results: MigrationResult = { success: true, items: {}, errors: [] };

  try {
    await IDBStore.init();
  } catch (error) {
    console.error('IndexedDB 初始化失败，无法迁移:', error);
    return { success: false, error: (error as Error).message, items: {}, errors: [] };
  }

  // Migrate chats
  try {
    const chatsJson = localStorage.getItem(KEYS_MAP.CHATS);
    if (chatsJson) {
      const chats = JSON.parse(chatsJson);
      if (Array.isArray(chats) && chats.length > 0) {
        await Promise.allSettled(chats.map((chat: unknown) => IDBStore.saveChat(chat)));
        results.items.chats = { status: 'completed', total: chats.length };
      } else {
        results.items.chats = { status: 'skipped', reason: 'empty' };
      }
    } else {
      results.items.chats = { status: 'skipped', reason: 'no_data' };
    }
  } catch (error) {
    results.errors.push(`chats: ${(error as Error).message}`);
  }

  // Migrate memory
  try {
    const memoryJson = localStorage.getItem(KEYS_MAP.MEMORY);
    if (memoryJson) {
      const memory = JSON.parse(memoryJson);
      if (Array.isArray(memory)) {
        await IDBStore.setMemory(memory);
        results.items.memory = { status: 'completed', count: memory.length };
      }
    } else {
      results.items.memory = { status: 'skipped', reason: 'no_data' };
    }
  } catch (error) {
    results.errors.push(`memory: ${(error as Error).message}`);
  }

  // Migrate keys
  try {
    const keysJson = localStorage.getItem(KEYS_MAP.KEYS);
    if (keysJson) {
      const keys = JSON.parse(keysJson);
      if (Array.isArray(keys)) {
        await IDBStore.setKeys(keys);
        results.items.keys = { status: 'completed', count: keys.length };
      }
    } else {
      results.items.keys = { status: 'skipped', reason: 'no_data' };
    }
    const activeKey = localStorage.getItem(KEYS_MAP.ACTIVE_KEY);
    if (activeKey) {
      await IDBStore.setActiveKey(activeKey);
      results.items.activeKey = { status: 'completed' };
    }
  } catch (error) {
    results.errors.push(`keys: ${(error as Error).message}`);
  }

  // Migrate config
  const configItems = [
    { key: KEYS_MAP.THEME, configKey: 'theme' },
    { key: KEYS_MAP.MODEL, configKey: 'model' },
    { key: KEYS_MAP.ACTIVE_CHAT, configKey: 'activeChatId' },
  ];
  for (const item of configItems) {
    try {
      const value = localStorage.getItem(item.key);
      if (value !== null) {
        await IDBStore.setConfig(item.configKey, value);
      }
    } catch (error) {
      results.errors.push(`config.${item.configKey}: ${(error as Error).message}`);
    }
  }

  // Migrate agents
  try {
    const currentAgent = localStorage.getItem('pollen_agent');
    if (currentAgent) {
      await IDBStore.setAgentConfig('currentAgentId', currentAgent);
    }
    const recentAgentsJson = localStorage.getItem('pollen_recent_agents');
    if (recentAgentsJson) {
      const recentAgents = JSON.parse(recentAgentsJson);
      if (Array.isArray(recentAgents)) {
        await IDBStore.setAgentConfig('recentAgents', recentAgents);
      }
    }
    const honeycomb = localStorage.getItem('pollen_honeycomb');
    if (honeycomb !== null) {
      await IDBStore.setConfig('honeycomb', honeycomb === '1');
    }
  } catch (error) {
    results.errors.push(`agents: ${(error as Error).message}`);
  }

  if (results.errors.length === 0) {
    localStorage.setItem(MIGRATION_KEY, JSON.stringify({ version: MIGRATION_VERSION, timestamp: Date.now() }));
    console.log('数据迁移完成');
  }

  return results;
}

export const Migration = { isMigrated, run };
