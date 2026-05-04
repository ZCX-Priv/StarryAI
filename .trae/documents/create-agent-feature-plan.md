# 创建智能体功能实现计划

## 功能概述
实现点击"创建 AI 智能体"按钮后弹出创建表单，用户可以填写智能体信息并自动存储到本地数据库。

## 功能需求
1. **弹窗表单字段**：
   - 智能体名称（必填）
   - Emoji头像选择器（可选，默认使用🤖）
   - 分类选择（从现有分类中选择：工作、学习、创作）
   - 描述（可选）
   - 角色定义/Prompt（必填，多行文本框）

2. **数据存储**：
   - 用户创建的智能体存储在IndexedDB的AGENTS store中
   - 加载智能体列表时合并默认智能体和用户自定义智能体

## 实现步骤

### 步骤1：添加弹窗HTML结构
**文件**：`index.html`

在现有弹窗结构后添加创建智能体弹窗：
```html
<div class="modal-overlay" id="create-agent-modal">
  <div class="modal" style="max-width:520px">
    <div class="modal-hd">
      <span class="modal-title">创建智能体</span>
      <button class="icon-btn" onclick="UI.closeModal('create-agent-modal')">...</button>
    </div>
    <div class="modal-body" id="create-agent-body">
      <!-- 表单内容 -->
    </div>
    <div class="modal-footer">
      <button class="btn-sm ghost" onclick="UI.closeModal('create-agent-modal')">取消</button>
      <button class="btn-sm primary" onclick="Agents.createAgent()">创建</button>
    </div>
  </div>
</div>
```

### 步骤2：添加CSS样式
**文件**：`css/modals.css`

添加以下样式：
- 表单组样式（`.form-group`）
- 输入框样式（`.form-input`, `.form-textarea`）
- Emoji选择器样式（`.emoji-picker`）
- 分类选择样式（`.category-select`）

### 步骤3：实现JavaScript逻辑
**文件**：`js/agents.js`

添加以下方法：

1. **`openCreateModal()`** - 打开创建智能体弹窗
   - 渲染表单内容
   - 初始化emoji选择器
   - 绑定事件

2. **`renderCreateForm()`** - 渲染创建表单
   - 名称输入框
   - Emoji选择器（常用emoji列表）
   - 分类下拉选择
   - 描述输入框
   - 角色定义文本框

3. **`createAgent()`** - 创建智能体
   - 验证必填字段
   - 生成唯一ID
   - 保存到IndexedDB
   - 刷新智能体列表
   - 显示成功提示

4. **`loadCustomAgents()`** - 加载用户自定义智能体
   - 从IndexedDB读取
   - 合并到agents列表

5. **`deleteCustomAgent(agentId)`** - 删除自定义智能体
   - 从IndexedDB删除
   - 刷新列表

### 步骤4：修改现有逻辑
**文件**：`js/agents.js`

1. 修改 `loadConfig()` 方法：
   - 加载默认配置后，调用 `loadCustomAgents()` 合并用户智能体

2. 修改 `renderAgents()` 方法：
   - 为用户自定义智能体添加删除按钮
   - 区分显示默认智能体和自定义智能体

### 步骤5：绑定按钮事件
**文件**：`js/app.js` 或 `js/agents.js`

为"创建 AI 智能体"按钮添加点击事件：
```javascript
document.querySelector('.create-agent-btn').addEventListener('click', () => {
  Agents.openCreateModal();
});
```

## 数据结构

### 智能体对象
```javascript
{
  id: 'custom_' + timestamp,  // 唯一ID
  name: '智能体名称',
  emoji: '🤖',  // emoji头像
  avatar: null,  // 用户创建的智能体不使用图片头像
  prompt: '用户输入的角色定义',
  description: '智能体描述',
  category: 'work',  // 分类ID
  isCustom: true  // 标记为用户自定义
}
```

### IndexedDB存储
- Store: `AGENTS`
- Key: `customAgents`
- Value: 自定义智能体数组

## 技术细节

### Emoji选择器实现
提供常用emoji列表供用户选择：
```javascript
const commonEmojis = ['🤖', '👨‍💻', '👩‍💻', '🎨', '📝', '📚', '💡', '🔧', '🎯', '🚀', '💼', '🎓', '✨', '🌟', '💪'];
```

### ID生成
使用时间戳生成唯一ID：
```javascript
const id = 'custom_' + Date.now();
```

### 表单验证
- 名称：必填，长度1-20字符
- 角色定义：必填，长度10-2000字符
- 描述：可选，最多100字符

## 文件修改清单

1. **index.html**
   - 添加创建智能体弹窗HTML结构

2. **css/modals.css**
   - 添加表单相关样式

3. **js/agents.js**
   - 添加 `openCreateModal()` 方法
   - 添加 `renderCreateForm()` 方法
   - 添加 `createAgent()` 方法
   - 添加 `loadCustomAgents()` 方法
   - 添加 `deleteCustomAgent()` 方法
   - 修改 `loadConfig()` 方法
   - 修改 `renderAgents()` 方法

4. **js/store-idb.js**
   - 已有 `getAgentConfig()` 和 `setAgentConfig()` 方法，无需修改

## 测试要点

1. 点击"创建 AI 智能体"按钮，弹窗正常显示
2. 表单验证正常工作
3. Emoji选择器可以选择emoji
4. 创建成功后智能体出现在列表中
5. 可以选择并使用自定义智能体
6. 可以删除自定义智能体
7. 刷新页面后自定义智能体仍然存在

## 实现顺序

1