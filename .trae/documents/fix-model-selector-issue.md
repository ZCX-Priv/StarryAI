# 模型选择器失效问题修复计划

## 问题分析

### 根本原因

模型选择器失效的原因是：**当用户切换模型时，只更新了全局状态 `state.model`，但没有更新当前对话的 `chat.model`**。

### 代码流程分析

1. **模型选择器调用链：**
   - 用户点击模型选择器 → 调用 `Keys.setModelAndUpdate(id)` ([keys.js:16](file:///c:/Users/赵晨旭/Desktop/AIChat/js/keys.js#L16))
   - `setModelAndUpdate` 方法实现：
     ```javascript
     setModelAndUpdate(id) { 
       state.model=id;                          // 只更新了全局状态
       Store.saveConfig('model', id); 
       UI.renderModelPill(); 
       Account.invalidate(); 
       Modals.renderModelPicker(); 
     }
     ```

2. **消息发送时的模型选择逻辑：**
   - 在 `Chat._streamResponse()` 中 ([chat.js:60-63](file:///c:/Users/赵晨旭/Desktop/AIChat/js/chat.js#L60-L63))：
     ```javascript
     let modelToUse=chat.model||state.model;  // 优先使用 chat.model
     if (state.currentMode === 'expert' && state.modeConfig.expert.model) {
       modelToUse = state.modeConfig.expert.model;
     }
     ```
   - **问题：** 如果 `chat.model` 存在，就会优先使用对话创建时保存的模型，而不是用户刚选择的新模型

3. **对话创建时保存模型：**
   - 在 `Chat.create()` 中 ([chat.js:15](file:///c:/Users/赵晨旭/Desktop/AIChat/js/chat.js#L15))：
     ```javascript
     const chat={id,title:'新对话',messages:[],createdAt:Date.now(),model:state.model,agentId:state.currentAgentId};
     ```
   - 新对话会保存当前的 `state.model` 到 `chat.model`

4. **存在但未使用的方法：**
   - `Chat.handleModelChange()` 方法 ([chat.js:159-161](file:///c:/Users/赵晨旭/Desktop/AIChat/js/chat.js#L159-L161)) 本应该更新当前对话的模型：
     ```javascript
     handleModelChange() {
       const chat=Chat.getActive(); if (chat) { chat.model=state.model; Store.saveChats(); }
     }
     ```
   - **但这个方法从未被调用！**

### 问题表现

- 用户在已有对话中切换模型后，继续对话时仍然使用旧模型
- 只有创建新对话时才会使用新选择的模型

## 修复方案

### 方案一：在模型切换时更新当前对话的模型（推荐）

**修改文件：** `js/keys.js`

**修改位置：** `setModelAndUpdate` 方法

**修改内容：**
```javascript
setModelAndUpdate(id) { 
  state.model=id; 
  Store.saveConfig('model', id); 
  UI.renderModelPill(); 
  Chat.handleModelChange();  // 添加这一行：更新当前对话的模型
  Account.invalidate(); 
  Modals.renderModelPicker(); 
}
```

**优点：**
- 简单直接，只需添加一行代码
- 符合用户预期：切换模型后立即生效
- 利用了已有的 `handleModelChange()` 方法

**缺点：**
- 无

### 方案二：修改消息发送逻辑（不推荐）

修改 `_streamResponse()` 和 `regenerate()` 方法，不使用 `chat.model`，直接使用 `state.model`。

**缺点：**
- 会破坏对话的模型记忆功能
- 用户可能希望不同对话使用不同模型
- 需要修改多处代码

## 实施步骤

1. **修改 `js/keys.js` 文件**
   - 在 `setModelAndUpdate` 方法中添加 `Chat.handleModelChange();` 调用

2. **测试验证**
   - 启动服务器
   - 创建一个新对话并发送消息
   - 切换到不同的模型
   - 在同一对话中继续发送消息，验证是否使用了新模型
   - 创建新对话，验证是否使用了新选择的模型

## 预期结果

修复后，用户切换模型时：
- 当前对话会立即使用新模型
- 新创建的对话也会使用新模型
- 模型选择器的行为符合用户预期
