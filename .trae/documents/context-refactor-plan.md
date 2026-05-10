# Context 重构计划

## 问题分析

### 1. 葡萄牙语Bug
- **根本原因**: 在 `js/state.js` 第11行，默认语言设置为 `lang: 'pt'`（葡萄牙语）
- **影响**: 当用户没有设置语言偏好时，系统默认使用葡萄牙语回答问题
- **解决方案**: 将默认语言改为 `'zh'`（中文）

### 2. Context模块臃肿
- **当前状态**: `js/context.js` 包含了所有上下文相关的逻辑（147行）
- **问题**: 代码耦合度高，难以维护
- **解决方案**: 模块化拆分到 `js/context/` 文件夹

## 重构方案

### 文件结构
```
js/
├── context/
│   ├── index.js          # 主入口，导出Context和Memory
│   ├── language.js       # 语言管理模块
│   ├── memory.js         # 记忆管理模块
│   └── system-prompt.js  # 系统提示词构建模块
├── context.js            # 删除（重构后）
└── ...其他文件
```

### 模块职责划分

#### 1. `language.js` - 语言管理
- `LANG_NAMES` 常量
- `hasLanguagePreference()` - 检查记忆中是否有语言偏好
- `getLanguageName()` - 获取语言名称

#### 2. `memory.js` - 记忆管理
- `extract(recentMsgs)` - 提取记忆
- `deduplicate()` - 去重记忆
- `clear()` - 清除记忆
- `editItem(i)` - 编辑记忆项
- `deleteItem(i)` - 删除记忆项

#### 3. `system-prompt.js` - 系统提示词构建
- `buildSystemPrompt()` - 构建系统提示词
- `buildMemoryExtractPrompt()` - 构建记忆提取提示词
- `buildMemoryDeduplicatePrompt()` - 构建记忆去重提示词
- `buildMessages()` - 构建消息数组

#### 4. `index.js` - 主入口
- 导入所有模块
- 组装Context对象
- 导出Context和Memory

## 实施步骤

### 步骤1: 创建context文件夹和模块文件
1. 创建 `js/context/` 文件夹
2. 创建 `js/context/language.js`
3. 创建 `js/context/memory.js`
4. 创建 `js/context/system-prompt.js`
5. 创建 `js/context/index.js`

### 步骤2: 修复葡萄牙语bug
1. 修改 `js/state.js` 第11行
2. 将 `lang: 'pt'` 改为 `lang: 'zh'`

### 步骤3: 迁移代码
1. 将语言相关代码迁移到 `language.js`
2. 将记忆相关代码迁移到 `memory.js`
3. 将系统提示词相关代码迁移到 `system-prompt.js`
4. 在 `index.js` 中组装并导出

### 步骤4: 更新引用
1. 检查所有引用 `Context` 和 `Memory` 的文件
2. 确保导入路径正确
3. 更新 `index.html` 第304行的脚本引用：
   - 删除 `<script src="js/context.js"></script>`
   - 添加 `<script src="js/context/index.js"></script>`
4. 删除旧的 `js/context.js` 文件

### 步骤5: 测试验证
1. 启动服务器测试功能
2. 验证语言设置是否正确
3. 验证记忆功能是否正常
4. 验证系统提示词是否正确构建

## 需要更新的文件

### 直接引用Context的文件
- `js/api.js` - 第6行使用 `Context.buildMessages()`
- `js/prompts.js` - 第68、69行使用 `Context.getLanguageName()` 和 `Context.hasLanguagePreference()`
- `js/chat.js` - 第120行使用 `Memory.extract()`
- `js/modals.js` - 可能使用Memory相关方法
- `js/ui.js` - 可能使用Memory相关方法

### 需要检查的文件
- `js/app.js` - 应用初始化
- `index.html` - 脚本引用顺序

## 注意事项

1. **保持向后兼容**: 确保所有API接口不变
2. **脚本加载顺序**: 在 `index.html` 中正确设置脚本加载顺序
3. **全局变量**: Context和Memory需要保持为全局变量
4. **测试覆盖**: 重构后需要全面测试所有功能

## 预期结果

1. ✅ 葡萄牙语bug修复 - 默认语言改为中文
2. ✅ 代码结构清晰 - 模块化拆分完成
3. ✅ 易于维护 - 每个模块职责单一
4. ✅ 功能完整 - 所有功能正常工作
