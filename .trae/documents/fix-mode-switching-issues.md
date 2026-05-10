# 修复快速/思考/专家模式切换问题

## 问题分析

### 问题1：切换模式后图标没有同步变化
**原因**：在 `js/ui.js` 的 `initDropdowns` 函数（第276-281行）中，更新图标时使用了 `outerHTML` 替换 SVG，但新插入的 SVG 元素没有 `data-icon` 属性。这导致下次切换模式时，`quickBtn.querySelector('svg[data-icon]')` 找不到元素，无法更新图标。

**代码位置**：`js/ui.js` 第276-281行
```javascript
const iconSvg=this.getAttribute('data-icon');
if (iconSvg) {
  const firstSvg=quickBtn.querySelector('svg[data-icon]');
  if (firstSvg) firstSvg.outerHTML=iconSvg;
}
```

### 问题2：切换模型后没有自动变回快速模式
**原因**：在 `js/keys.js` 的 `setModelAndUpdate` 函数（第16行）中，只更新了模型和相关的UI，但没有将模式重置为 'fast'。某些模型可能不支持思考模式或专家模式，因此切换模型时应该重置为快速模式。

**代码位置**：`js/keys.js` 第16行
```javascript
setModelAndUpdate(id) { 
  state.model=id; 
  Store.saveConfig('model', id); 
  UI.renderModelPill(); 
  UI.updateThinkingModeVisibility(); 
  Chat.handleModelChange(); 
  Account.invalidate(); 
  Modals.renderModelPicker(); 
}
```

### 问题3：页面初始化时，模式按钮的状态没有正确显示
**原因**：在 `js/app.js` 的 `init` 函数（第54-56行）中，虽然从存储中加载了 `currentMode` 并设置了状态，但没有更新UI来反映当前模式。模式按钮仍然显示默认的"快速"状态。

**代码位置**：`js/app.js` 第54-56行
```javascript
const currentMode = await Store.loadConfig('currentMode', 'fast');
state.currentMode = currentMode;
await Prompts.loadModePrompt(currentMode);
```

## 修复方案

### 步骤1：修复图标更新问题
在 `js/ui.js` 的 `initDropdowns` 函数中，更新图标后需要给新的 SVG 添加 `data-icon` 属性。

**修改位置**：`js/ui.js` 第276-281行

**修改内容**：
```javascript
const iconSvg=this.getAttribute('data-icon');
if (iconSvg) {
  const firstSvg=quickBtn.querySelector('svg[data-icon]');
  if (firstSvg) {
    firstSvg.outerHTML=iconSvg;
    // 给新插入的 SVG 添加 data-icon 属性
    const newSvg = quickBtn.querySelector('svg:first-of-type');
    if (newSvg) newSvg.setAttribute('data-icon', 'mode');
  }
}
```

### 步骤2：添加模式UI更新函数
在 `js/ui.js` 中添加一个新函数 `updateModeButton`，用于更新模式按钮的显示状态（图标、文本、下拉菜单的active状态）。

**添加位置**：`js/ui.js` 中

**新增函数**：
```javascript
updateModeButton() {
  const quickBtn = document.getElementById('quickBtn');
  const quickMenu = document.getElementById('quickMenu');
  if (!quickBtn || !quickMenu) return;
  
  const currentItem = quickMenu.querySelector(`.dropdown-item[data-mode="${state.currentMode}"]`);
  if (!currentItem) return;
  
  // 更新下拉菜单的active状态
  quickMenu.querySelectorAll('.dropdown-item').forEach(i => {
    i.classList.remove('active');
    const check = i.querySelector('.dropdown-check');
    if (check) check.remove();
  });
  currentItem.classList.add('active');
  const checkHtml = '<div class="dropdown-check"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 12L10 17L19 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>';
  currentItem.insertAdjacentHTML('beforeend', checkHtml);
  
  // 更新按钮文本
  const label = currentItem.querySelector('.dropdown-item-header span').textContent;
  quickBtn.querySelector('span').textContent = label;
  
  // 更新按钮图标
  const iconSvg = currentItem.getAttribute('data-icon');
  if (iconSvg) {
    const firstSvg = quickBtn.querySelector('svg[data-icon]');
    if (firstSvg) {
      firstSvg.outerHTML = iconSvg;
      const newSvg = quickBtn.querySelector('svg:first-of-type');
      if (newSvg) newSvg.setAttribute('data-icon', 'mode');
    }
  }
}
```

### 步骤3：添加模式重置函数
在 `js/ui.js` 中添加一个新函数 `resetModeToFast`，用于将模式重置为快速模式并更新UI。

**添加位置**：`js/ui.js` 中

**新增函数**：
```javascript
async resetModeToFast() {
  state.currentMode = 'fast';
  await Prompts.loadModePrompt('fast');
  if (window.Store) {
    Store.saveConfig('currentMode', 'fast');
  }
  UI.updateModeButton();
}
```

### 步骤4：在模型切换时重置模式
修改 `js/keys.js` 的 `setModelAndUpdate` 函数，在切换模型时调用 `UI.resetModeToFast()` 重置模式。

**修改位置**：`js/keys.js` 第16行

**修改内容**：
```javascript
async setModelAndUpdate(id) { 
  state.model=id; 
  Store.saveConfig('model', id); 
  UI.renderModelPill(); 
  UI.updateThinkingModeVisibility(); 
  Chat.handleModelChange(); 
  Account.invalidate(); 
  Modals.renderModelPicker();
  await UI.resetModeToFast();
}
```

### 步骤5：在页面初始化时更新模式按钮
修改 `js/app.js` 的 `init` 函数，在加载模式后调用 `UI.updateModeButton()` 更新UI。

**修改位置**：`js/app.js` 第54-56行

**修改内容**：
```javascript
const currentMode = await Store.loadConfig('currentMode', 'fast');
state.currentMode = currentMode;
await Prompts.loadModePrompt(currentMode);
UI.updateModeButton();
```

### 步骤6：在模式切换时也调用更新函数
修改 `js/ui.js` 的 `initDropdowns` 函数中的模式切换逻辑，使用新的 `updateModeButton` 函数来简化代码并确保一致性。

**修改位置**：`js/ui.js` 第256-283行

**修改内容**：
```javascript
quickMenu.querySelectorAll('.dropdown-item').forEach(item=>{
  item.addEventListener('click', async function() {
    const mode = this.getAttribute('data-mode');
    
    if (mode) {
      state.currentMode = mode;
      await Prompts.loadModePrompt(mode);
      if (window.Store) {
        Store.saveConfig('currentMode', mode);
      }
    }
    
    UI.updateModeButton();
    UI.closeAllDropdowns();
  });
});
```

## 测试验证

修复完成后，需要验证以下场景：

1. **模式切换测试**：
   - 点击模式按钮，选择"思考"模式，验证按钮图标和文本是否正确更新为思考模式
   - 再次点击模式按钮，选择"专家"模式，验证按钮图标和文本是否正确更新为专家模式
   - 再次点击模式按钮，选择"快速"模式，验证按钮图标和文本是否正确更新为快速模式

2. **模型切换测试**：
   - 先切换到"思考"或"专家"模式
   - 然后切换模型
   - 验证模式是否自动重置为"快速"模式，按钮图标和文本是否正确显示

3. **页面刷新测试**：
   - 切换到"思考"或"专家"模式
   - 刷新页面
   - 验证模式按钮是否正确显示为之前选择的模式

4. **下拉菜单状态测试**：
   - 切换模式后，再次打开下拉菜单
   - 验证当前选中的模式是否有active状态和勾选标记
