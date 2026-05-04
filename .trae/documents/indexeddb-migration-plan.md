# IndexedDB 迁移计划

## 一、当前存储架构分析

### 1.1 localStorage 键值映射 (KEYS_MAP)
| 键名 | 用途 | 数据类型 |
|------|------|----------|
| `pollen_keys` | 所有密钥列表 | `string[]` |
| `pollen_active_key` | 当前激活密钥 | `string` |
| `pollen_chats` | 所有聊天记录 | `Chat[]` |
| `pollen_active_chat` | 当前激活聊天ID | `string` |
| `pollen_memory` | 记忆数据 | `string[]` |
| `pollen_theme` | 主题设置 | `string` |
| `pollen_model` | 当前模型 | `string` |

### 1.2 其他 localStorage 键
| 键名 | 用途 | 数据类型 |
|------|------|----------|
| `pollen_agent` | 当前智能体ID | `string` |
| `pollen_recent_agents` | 最近使用的智能体 | `string[]` |
| `pollen_honeycomb` | 蜂巢视图开关 | `string` |

### 1.3 当前问题
1. **容量限制**：localStorage 约 5MB 限制，聊天数据可能超限
2. **同步阻塞**：localStorage 同步操作阻塞主线程
3. **错误传播**：一个数据项保存失败可能影响其他项
4. **无事务支持**：无法保证数据一致性

---

## 二、IndexedDB 架构设计

### 2.1 数据库结构
```
数据库名: AIChatDB
版本: 1

对象仓库 (Object Stores):
├── config          # 配置项 (主题、模型等)
├── chats           # 聊天记录
├── messages        # 消息 (独立存储，支持大量消息)
├── memory          # 记忆数据
├── keys            # 密钥列表
└── agents          # 智能体相关数据
```

### 2.2 独立存储设计
每项数据修改独立进行，使用独立的数据库事务：
- 单个聊天保存失败不影响其他聊天
- 单条消息保存失败不影响其他消息
- 配置项保存失败不影响聊天数据

---

## 三、实施步骤

### 步骤 1：创建 IndexedDB 存储模块
**文件**: `js/store-idb.js`

创建 `IDBStore` 对象，提供：
- `init()` - 初始化数据库
- `get(store, key)` - 获取单条数据
- `getAll(store)` - 获取所有数据
- `set(store, key, value)` - 保存单条数据
- `delete(store, key)` - 删除数据
- `clear(store)` - 清空仓库

特性：
- Promise 封装，支持 async/await
- 独立事务处理
- 完善的错误捕获和日志

### 步骤 2：创建数据迁移模块
**文件**: `js/store-migrate.js`

创建 `Migration` 对象：
- `run()` - 执行迁移
- `migrateItem(key, storeName)` - 迁移单项数据
- 迁移后保留 localStorage 作为备份

### 步骤 3：更新 Store 对象
**修改文件**: `js/store-theme-account.js`

更新 `Store` 对象：
- 改为异步方法 (`saveChats()` → `await saveChats()`)
- 使用 IndexedDB 作为主存储
- 添加降级逻辑 (IndexedDB 不可用时使用 localStorage)

### 步骤 4：更新所有调用点
需要修改的文件和方法：

| 文件 | 方法 | 修改内容 |
|------|------|----------|
| `chat.js` | `addMsg()`, `create()`, `delete()` | `Store.saveChats()` 改为 `await Store.saveChats()` |
| `memory.js` | `extract()`, `clear()`, `editItem()`, `deleteItem()` | `Store.saveMemory()` 改为 `await Store.saveMemory()` |
| `keys.js` | `activate()`, `add()`, `delete()`, `setModel()` | 改为异步保存 |
| `agents.js` | `select()`, `addToRecent()` | 改为异步保存 |
| `canvas.js` | `setHoneycomb()` | 改为异步保存 |
| `app.js` | `init()` | 添加迁移初始化 |
| `store-theme-account.js` | `Theme.apply()` | 改为异步保存 |

### 步骤 5：更新初始化流程
**修改文件**: `js/app.js`

修改 `init()` 函数：
1. 先初始化 IndexedDB
2. 执行数据迁移 (从 localStorage 迁移到 IndexedDB)
3. 加载数据到 state
4. 启动应用

### 步骤 6：添加错误处理和降级
- IndexedDB 操作失败时记录日志
- 提供降级到 localStorage 的选项
- 单项保存失败不影响其他项

---

## 四、API 设计

### 4.1 IDBStore API
```javascript
const IDBStore = {
  // 初始化数据库
  async init(): Promise<void>
  
  // 获取单条数据
  async get(storeName: string, key: string): Promise<any>
  
  // 获取所有数据
  async getAll(storeName: string): Promise<any[]>
  
  // 保存数据
  async set(storeName: string, key: string, value: any): Promise<void>
  
  // 删除数据
  async delete(storeName: string, key: string): Promise<void>
  
  // 清空仓库
  async clear(storeName: string): Promise<void>
  
  // 批量操作 (独立事务)
  async batchSet(storeName: string, items: Array<{key, value}>): Promise<void>
}
```

### 4.2 更新后的 Store API
```javascript
const Store = {
  // 保存聊天 (独立事务)
  async saveChats(): Promise<void>
  
  // 保存单个聊天 (独立事务)
  async saveChat(chatId: string): Promise<void>
  
  // 保存记忆
  async saveMemory(): Promise<void>
  
  // 保存密钥
  async saveKeys(): Promise<void>
  
  // 保存配置项
  async saveConfig(key: string, value: any): Promise<void>
  
  // 加载数据
  async load(key: string, fallback?: any): Promise<any>
}
```

---

## 五、数据结构定义

### 5.1 config 仓库
```javascript
{
  key: string,    // 配置项名称 (主键)
  value: any      // 配置值
}
```

### 5.2 chats 仓库
```javascript
{
  id: string,           // 聊天ID (主键)
  title: string,        // 聊天标题
  messages: Message[],  // 消息列表
  createdAt: number,    // 创建时间
  model: string,        // 使用的模型
  agentId: string       // 智能体ID
}
```

### 5.3 messages 仓库 (可选，用于大量消息)
```javascript
{
  id: string,        // 消息ID (主键)
  chatId: string,    // 所属聊天ID (索引)
  role: string,      // 角色
  content: string,   // 内容
  ts: number         // 时间戳
}
```

---

## 六、错误隔离机制

### 6.1 独立事务原则
每个保存操作使用独立的数据库事务：
```javascript
async saveChat(chatId) {
  try {
    const chat = state.chats.find(c => c.id === chatId);
    await IDBStore.set('chats', chatId, chat);
  } catch (error) {
    console.error(`保存聊天 ${chatId} 失败:`, error);
    // 不抛出错误，不影响其他操作
  }
}
```

### 6.2 批量保存的独立处理
```javascript
async saveChats() {
  const results = await Promise.allSettled(
    state.chats.map(chat => this.saveChat(chat.id))
  );
  // 记录失败项，但不影响成功的项
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.error(`聊天 ${state.chats[i].id} 保存失败:`, r.reason);
    }
  });
}
```

---

## 七、迁移策略

### 7.1 迁移流程
```
启动应用
    ↓
初始化 IndexedDB
    ↓
检查迁移标记 (indexeddb_migrated)
    ↓
未迁移 → 执行迁移
    ↓
逐项迁移 localStorage 数据到 IndexedDB
    ↓
设置迁移完成标记
    ↓
加载 IndexedDB 数据到 state
    ↓
启动应用
```

### 7.2 向后兼容
- 迁移后保留 localStorage 数据作为备份
- 首次运行时自动迁移
- 支持手动触发重新迁移

---

## 八、测试要点

1. **数据迁移测试**
   - 验证所有 localStorage 数据正确迁移
   - 验证迁移后数据完整性

2. **独立保存测试**
   - 模拟单个聊天保存失败
   - 验证其他聊天不受影响

3. **容量测试**
   - 创建大量聊天和消息
   - 验证存储和读取性能

4. **降级测试**
   - 模拟 IndexedDB 不可用
   - 验证降级到 localStorage

---

## 九、文件变更清单

| 操作 | 文件 | 说明 |
|------|------|------|
| 新建 | `js/store-idb.js` | IndexedDB 存储模块 |
| 新建 | `js/store-migrate.js` | 数据迁移模块 |
| 修改 | `js/store-theme-account.js` | 更新 Store 对象 |
| 修改 | `js/app.js` | 更新初始化流程 |
| 修改 | `js/chat.js` | 异步保存调用 |
| 修改 | `js/memory.js` | 异步保存调用 |
| 修改 | `js/keys.js` | 异步保存调用 |
| 修改 | `js/agents.js` | 异步保存调用 |
| 修改 | `js/canvas.js` | 异步保存调用 |
| 修改 | `index.html` | 引入新模块 |
