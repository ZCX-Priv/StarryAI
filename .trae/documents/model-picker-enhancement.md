# 模型选择器增强功能实施计划

## 需求概述
1. 在模型选择器中添加搜索框，支持实时搜索过滤模型
2. 为支持推理的模型添加原子图标（在钻石图标旁边）
3. 选择模型后自动关闭模型选择器

## 当前代码分析

### 相关文件
- `js/modals.js` - 包含 `renderModelPicker()` 方法（第106-124行）
- `js/keys.js` - 包含 `setModelAndUpdate()` 方法
- `css/modals.css` - 模型选择器样式
- `models.json` - 模型数据，包含 `reasoning` 字段

### 现有实现
- 模型数据已包含 `reasoning: true` 字段标识支持推理的模型
- 钻石图标已在 `renderModelPicker()` 中实现（第110行）
- 模型选择通过 `Keys.setModelAndUpdate()` 方法处理

## 实施步骤

### 步骤 1: 添加搜索框 HTML 和样式
**文件**: `js/modals.js` - `renderModelPicker()` 方法

**修改内容**:
- 在模型列表顶部添加搜索输入框
- 添加搜索框的实时过滤功能
- 添加清除搜索的按钮

**实现细节**:
```javascript
// 在 body.innerHTML 中添加搜索框
<div class="mp-search-wrapper">
  <svg class="mp-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
  <input type="text" class="mp-search-input" id="model-search-input" placeholder="搜索模型..." oninput="Modals.filterModels(this.value)">
  <button class="mp-search-clear" id="model-search-clear" onclick="Modals.clearModelSearch()" style="display:none">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  </button>
</div>
```

### 步骤 2: 添加搜索过滤逻辑
**文件**: `js/modals.js`

**新增方法**:
```javascript
filterModels(searchTerm) {
  const filteredModels = state.models.filter(m => {
    const label = (m.label || m.id).toLowerCase();
    const term = searchTerm.toLowerCase();
    return label.includes(term) || m.id.toLowerCase().includes(term);
  });
  Modals._renderModelList(filteredModels);
}

clearModelSearch() {
  const input = document.getElementById('model-search-input');
  if (input) {
    input.value = '';
    Modals.filterModels('');
  }
}

_renderModelList(models) {
  // 提取现有的模型列表渲染逻辑到这个方法
}
```

### 步骤 3: 添加原子图标
**文件**: `js/modals.js` - `renderModelPicker()` 方法

**修改内容**:
在钻石图标旁边添加原子图标（如果模型支持推理）

**原子图标 SVG**:
```svg
<svg style="flex-shrink:0;margin-left:4px;color:var(--accent2)" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="1"/>
  <circle cx="12" cy="12" r="5"/>
  <ellipse cx="12" cy="12" rx="10" ry="4"/>
  <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/>
  <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/>
</svg>
```

**实现逻辑**:
```javascript
const reasoningIcon = m.reasoning ? `<svg style="flex-shrink:0;margin-left:4px;color:var(--accent2)" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="1"/>
  <circle cx="12" cy="12" r="5"/>
  <ellipse cx="12" cy="12" rx="10" ry="4"/>
  <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/>
  <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/>
</svg>` : '';
```

### 步骤 4: 自动关闭模型选择器
**文件**: `js/keys.js` - `setModelAndUpdate()` 方法

**修改内容**:
在方法末尾添加关闭模态框的调用

```javascript
async setModelAndUpdate(id) { 
  state.model = id; 
  Store.saveConfig('model', id); 
  UI.renderModelPill(); 
  UI.updateThinkingModeVisibility(); 
  Chat.handleModelChange(); 
  Account.invalidate(); 
  Modals.renderModelPicker();
  await UI.resetModeToFast();
  UI.closeModal('model-modal'); // 添加这一行
}
```

### 步骤 5: 添加搜索框样式
**文件**: `css/modals.css`

**新增样式**:
```css
/* Model Picker Search */
.mp-search-wrapper {
  position: relative;
  margin-bottom: 12px;
}

.mp-search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text3);
  pointer-events: none;
}

.mp-search-input {
  width: 100%;
  padding: 10px 36px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg3);
  font-family: var(--font);
  font-size: 13.5px;
  color: var(--text);
  transition: border-color .15s, box-shadow .15s;
}

.mp-search-input:focus {
  outline: none;
  border-color: var(--accent2);
  box-shadow: 0 0 0 3px var(--accent-glow);
}

.mp-search-input::placeholder {
  color: var(--text3);
}

.mp-search-clear {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  background: none;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text3);
  transition: background .15s, color .15s;
}

.mp-search-clear:hover {
  background: var(--bg4);
  color: var(--text);
}
```

## 测试要点
1. 搜索框能正常显示和输入
2. 输入搜索词后模型列表实时过滤
3. 清除按钮能正常清空搜索框
4. 支持推理的模型显示原子图标
5. 原子图标显示在钻石图标旁边
6. 选择模型后模态框自动关闭
7. 搜索功能不影响模型选择功能

## 文件修改清单
1. `js/modals.js` - 修改 `renderModelPicker()` 方法，添加搜索相关方法
2. `js/keys.js` - 修改 `setModelAndUpdate()` 方法
3. `css/modals.css` - 添加搜索框样式
