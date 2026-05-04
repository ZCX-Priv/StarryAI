# AI模型上下文管理统一重构计划

## 目标

将分散在多个文件中的AI模型上下文管理及处理逻辑统一至新建的 `js/context.js` 文件中，提高代码的可维护性和内聚性。

## 当前代码分布分析

### 1. memory.js（记忆管理）
- `Memory.extract()` - 从对话中提取记忆
- `Memory.deduplicate()` - 记忆去重
- `Memory.clear()` - 清除记忆
- `Memory.editItem()` - 编辑记忆项
- `Memory.deleteItem()` - 删除记忆项

### 2. prompts.js（提示词构建）
- `Prompts.buildSystemPromptFromTemplate()` - 构建系统提示（包含记忆上下文）
- `Prompts.buildMemoryExtractPrompt()` - 构建记忆提取提示
- `Prompts.buildMemoryDeduplicatePrompt()` - 构建记忆去重提示
- 语言检测逻辑 `memHasLang`

### 3. api.js（API请求）
- `API.buildSystemPrompt()` - 构建系统提示（fallback版本，与prompts.js有重复逻辑）
- `API.buildMessages()` - 构建消息列表
- 语言检测逻辑 `memHasLang`（重复代码）

### 4. state.js（状态管理）
- `state.memory` - 存储记忆数据
- `state.memoryExtractTemplate` - 记忆提取模板
- `state.memoryDeduplicateTemplate` - 记忆去重模板

### 5. config.js（配置）
- `MEMORY_MAX_BLOCKS` - 记忆最大条数常量

### 6. chat.js（对话处理）
- 调用 `Memory.extract(chat.messages.slice(-6))` 提取记忆

---

## 重构方案

### 新建文件：js/context.js

将包含以下模块化的上下文管理功能：

```javascript
/* ─── Context - AI模型上下文管理 ───────────────────────── */
const Context = {
  // 语言配置
  LANG_NAMES: { pt, en, es, fr, de, it, ja, zh, ko, ru },
  
  // 语言检测
  hasLanguagePreference(),
  getLanguageName(),
  
  // 记忆管理
  Memory: {
    extract(),
    deduplicate(),
    clear(),
    editItem(),
    deleteItem()
  },
  
  // 系统提示构建
  buildSystemPrompt(),
  buildMemoryExtractPrompt(),
  buildMemoryDeduplicatePrompt(),
  
  // 消息构建
  buildMessages()
};
```

---

## 实施步骤

### 步骤1：创建 context.js 文件
- 创建 `js/context.js`
- 定义 `Context` 模块
- 迁移语言相关配置和工具函数

### 步骤2：迁移记忆管理逻辑
- 从 `memory.js` 迁移所有记忆管理函数
- 整合为 `Context.Memory` 子模块
- 保持原有API兼容性

### 步骤3：迁移系统提示构建逻辑
- 从 `prompts.js` 迁移 `buildSystemPromptFromTemplate()`
- 从 `api.js` 迁移 `buildSystemPrompt()` fallback逻辑
- 合并重复的语言检测代码
- 统一为 `Context.buildSystemPrompt()`

### 步骤4：迁移记忆提示构建逻辑
- 从 `prompts.js` 迁移 `buildMemoryExtractPrompt()`
- 从 `prompts.js` 迁移 `buildMemoryDeduplicatePrompt()`

### 步骤5：迁移消息构建逻辑
- 从 `api.js` 迁移 `buildMessages()` 函数

### 步骤6：更新依赖文件
- 更新 `api.js`：移除重复代码，调用 `Context` 模块
- 更新 `prompts.js`：移除已迁移的上下文相关函数
- 更新 `chat.js`：使用 `Context.Memory.extract()`
- 更新 `memory.js`：删除文件（已迁移）
- 更新 `app.js`：确保正确加载顺序

### 步骤7：更新HTML引用
- 在 `index.html` 中添加 `context.js` 引用
- 确保加载顺序正确（在依赖模块之前）

### 步骤8：验证测试
- 测试记忆提取功能
- 测试记忆去重功能
- 测试系统提示构建
- 测试对话功能

---

## 文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `js/context.js` | 新建 | 上下文管理核心模块 |
| `js/memory.js` | 删除 | 已迁移至context.js |
| `js/api.js` | 修改 | 移除重复代码，调用Context模块 |
| `js/prompts.js` | 修改 | 移除上下文相关函数 |
| `js/chat.js` | 修改 | 使用Context.Memory |
| `index.html` | 修改 | 添加context.js引用 |

---

## 新模块API设计

```javascript
const Context = {
  // 语言工具
  LANG_NAMES: { pt: 'Portuguese (Brazilian)', ... },
  hasLanguagePreference: () => boolean,
  getLanguageName: () => string,
  
  // 记忆管理
  Memory: {
    extract: async (recentMsgs) => void,
    deduplicate: async () => void,
    clear: () => void,
    editItem: (index) => void,
    deleteItem: (index) => void
  },
  
  // 提示构建
  buildSystemPrompt: () => string,
  buildMemoryExtractPrompt: (existingMemory, conversation) => string,
  buildMemoryDeduplicatePrompt: (memoryList, maxEntries) => string,
  
  // 消息构建
  buildMessages: (msgs) => array
};
```

---

## 兼容性考虑

为保持向后兼容，可在原位置保留别名：
- `Memory` → `Context.Memory` 的全局别名
- 保持现有调用方式不变

---

## 预期收益

1. **代码内聚性**：上下文相关逻辑集中管理
2. **减少重复**：消除语言检测等重复代码
3. **易于维护**：修改上下文逻辑只需修改一处
4. **清晰职责**：每个模块职责更加明确
