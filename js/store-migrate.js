/* ─── 数据迁移 ───────────────────────────────────────── */
const Migration = {
  MIGRATION_KEY: 'aichat_idb_migrated',
  MIGRATION_VERSION: 1,

  async isMigrated() {
    const migrated = localStorage.getItem(this.MIGRATION_KEY);
    if (!migrated) return false;
    try {
      const data = JSON.parse(migrated);
      return data.version === this.MIGRATION_VERSION;
    } catch {
      return false;
    }
  },

  async run() {
    if (await this.isMigrated()) {
      console.log('数据已迁移，跳过');
      return { success: true, skipped: true };
    }

    console.log('开始迁移 localStorage 数据到 IndexedDB...');
    
    const results = {
      success: true,
      items: {},
      errors: []
    };

    try {
      await IDBStore.init();
    } catch (error) {
      console.error('IndexedDB 初始化失败，无法迁移:', error);
      return { success: false, error: error.message };
    }

    await this.migrateChats(results);
    await this.migrateMemory(results);
    await this.migrateKeys(results);
    await this.migrateConfig(results);
    await this.migrateAgents(results);

    if (results.errors.length === 0) {
      localStorage.setItem(this.MIGRATION_KEY, JSON.stringify({
        version: this.MIGRATION_VERSION,
        timestamp: Date.now()
      }));
      console.log('数据迁移完成');
    } else {
      console.warn('数据迁移完成，但有部分错误:', results.errors);
    }

    return results;
  },

  async migrateChats(results) {
    try {
      const chatsJson = localStorage.getItem(KEYS.KEYS_MAP.CHATS);
      if (!chatsJson) {
        results.items.chats = { status: 'skipped', reason: 'no_data' };
        return;
      }

      const chats = JSON.parse(chatsJson);
      if (!Array.isArray(chats) || chats.length === 0) {
        results.items.chats = { status: 'skipped', reason: 'empty' };
        return;
      }

      const migrateResults = await Promise.allSettled(
        chats.map(chat => IDBStore.saveChat(chat))
      );

      const failed = migrateResults.filter(r => r.status === 'rejected');
      if (failed.length > 0) {
        results.errors.push(`chats: ${failed.length} 项迁移失败`);
      }

      results.items.chats = {
        status: 'completed',
        total: chats.length,
        failed: failed.length
      };
    } catch (error) {
      results.errors.push(`chats: ${error.message}`);
      results.items.chats = { status: 'error', error: error.message };
    }
  },

  async migrateMemory(results) {
    try {
      const memoryJson = localStorage.getItem(KEYS.KEYS_MAP.MEMORY);
      if (!memoryJson) {
        results.items.memory = { status: 'skipped', reason: 'no_data' };
        return;
      }

      const memory = JSON.parse(memoryJson);
      if (!Array.isArray(memory)) {
        results.items.memory = { status: 'skipped', reason: 'invalid_format' };
        return;
      }

      await IDBStore.setMemory(memory);
      results.items.memory = { status: 'completed', count: memory.length };
    } catch (error) {
      results.errors.push(`memory: ${error.message}`);
      results.items.memory = { status: 'error', error: error.message };
    }
  },

  async migrateKeys(results) {
    try {
      const keysJson = localStorage.getItem(KEYS.KEYS_MAP.KEYS);
      if (keysJson) {
        const keys = JSON.parse(keysJson);
        if (Array.isArray(keys)) {
          await IDBStore.setKeys(keys);
          results.items.keys = { status: 'completed', count: keys.length };
        }
      } else {
        results.items.keys = { status: 'skipped', reason: 'no_data' };
      }

      const activeKey = localStorage.getItem(KEYS.KEYS_MAP.ACTIVE_KEY);
      if (activeKey) {
        await IDBStore.setActiveKey(activeKey);
        results.items.activeKey = { status: 'completed' };
      } else {
        results.items.activeKey = { status: 'skipped', reason: 'no_data' };
      }
    } catch (error) {
      results.errors.push(`keys: ${error.message}`);
      results.items.keys = { status: 'error', error: error.message };
    }
  },

  async migrateConfig(results) {
    const configItems = [
      { key: KEYS.KEYS_MAP.THEME, configKey: 'theme' },
      { key: KEYS.KEYS_MAP.MODEL, configKey: 'model' },
      { key: KEYS.KEYS_MAP.ACTIVE_CHAT, configKey: 'activeChatId' }
    ];

    results.items.config = { status: 'completed', items: {} };

    for (const item of configItems) {
      try {
        const value = localStorage.getItem(item.key);
        if (value !== null) {
          await IDBStore.setConfig(item.configKey, value);
          results.items.config.items[item.configKey] = { status: 'completed' };
        } else {
          results.items.config.items[item.configKey] = { status: 'skipped', reason: 'no_data' };
        }
      } catch (error) {
        results.errors.push(`config.${item.configKey}: ${error.message}`);
        results.items.config.items[item.configKey] = { status: 'error', error: error.message };
      }
    }
  },

  async migrateAgents(results) {
    results.items.agents = { status: 'completed', items: {} };

    try {
      const currentAgent = localStorage.getItem('pollen_agent');
      if (currentAgent) {
        await IDBStore.setAgentConfig('currentAgentId', currentAgent);
        results.items.agents.items.currentAgentId = { status: 'completed' };
      } else {
        results.items.agents.items.currentAgentId = { status: 'skipped', reason: 'no_data' };
      }
    } catch (error) {
      results.errors.push(`agents.currentAgentId: ${error.message}`);
      results.items.agents.items.currentAgentId = { status: 'error', error: error.message };
    }

    try {
      const recentAgentsJson = localStorage.getItem('pollen_recent_agents');
      if (recentAgentsJson) {
        const recentAgents = JSON.parse(recentAgentsJson);
        if (Array.isArray(recentAgents)) {
          await IDBStore.setAgentConfig('recentAgents', recentAgents);
          results.items.agents.items.recentAgents = { status: 'completed', count: recentAgents.length };
        }
      } else {
        results.items.agents.items.recentAgents = { status: 'skipped', reason: 'no_data' };
      }
    } catch (error) {
      results.errors.push(`agents.recentAgents: ${error.message}`);
      results.items.agents.items.recentAgents = { status: 'error', error: error.message };
    }

    try {
      const honeycomb = localStorage.getItem('pollen_honeycomb');
      if (honeycomb !== null) {
        await IDBStore.setConfig('honeycomb', honeycomb === '1');
        results.items.agents.items.honeycomb = { status: 'completed' };
      } else {
        results.items.agents.items.honeycomb = { status: 'skipped', reason: 'no_data' };
      }
    } catch (error) {
      results.errors.push(`config.honeycomb: ${error.message}`);
      results.items.agents.items.honeycomb = { status: 'error', error: error.message };
    }
  },

  async clearMigrationFlag() {
    localStorage.removeItem(this.MIGRATION_KEY);
    console.log('迁移标记已清除，下次启动将重新迁移');
  }
};
