# Banner模式选择功能实现计划

## 需求分析

用户希望实现以下功能：
1. 当点击一个banner模式按钮（如"图像生成"、"解题答疑"等）时，该按钮显示为选中的蓝框样式
2. 其他模式按钮隐藏
3. 再次点击该按钮时，取消选中状态，恢复所有按钮显示

## 当前代码结构

### 现有组件
1. **Banner按钮**：通过 `banner.js` 动态渲染，配置在 `config/banner.json`
2. **模式选择**：快速/思考/专家模式在 `quickMenu` 下拉菜单中
3. **状态管理**：`state.js` 中管理 `currentBannerMode` 和 `bannerPrompt`

### 相关文件
- `js/banner.js` - Banner按钮的渲染和事件处理
- `js/ui.js` - UI交互逻辑
- `js/state.js` - 状态管理
- `css/input.css` - 输入区域样式

## 实现步骤

### 步骤1：添加CSS样式
在 `css/input.css` 中添加选中状态的样式：
- 为 `.action-btn.selected` 添加蓝框样式
- 使用 `border` 和 `box-shadow` 实现选中效果

### 步骤2：修改Banner按钮点击逻辑
在 `js/banner.js` 的 `handleAction` 方法中：
1. 检查是否已选中该模式
2. 如果已选中，则取消选中（移除样式、恢复所有按钮显示、清空状态）
3. 如果未选中，则选中该模式（添加样式、隐藏其他按钮、设置状态）

### 步骤3：添加辅助方法
在 `js/banner.js` 中添加以下方法：
- `setSelectedButton(actionId)` - 设置选中的按钮
- `clearSelection()` - 清除所有选中状态
- `hideOtherButtons(selectedActionId)` - 隐藏其他按钮
- `showAllButtons()` - 显示所有按钮

### 步骤4：更新UI逻辑
确保按钮的显示/隐藏和选中状态同步更新

## 详细实现

### 1. CSS样式（css/input.css）
```css
/* Banner按钮选中状态 */
.action-btn.selected {
  border: 2px solid var(--accent);
  background: var(--accent-glow);
  color: var(--accent);
  box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
}
```

### 2. JavaScript逻辑（js/banner.js）

#### 修改 `handleAction` 方法
```javascript
async handleAction(action) {
  const input = document.getElementById('msg-input');
  if (!input) return;
  
  // 检查是否已选中该模式
  if (state.currentBannerMode === action.id) {
    // 取消选中
    this.clearSelection();
    input.placeholder = '发消息...';
    UI.showToast(`已退出${action.name}模式`);
    return;
  }
  
  // 选中新模式
  const prompt = await this.loadPrompt(action.prompt);
  if (prompt) {
    this.setSelectedButton(action.id);
    state.currentBannerMode = action.id;
    state.bannerPrompt = prompt;
    input.placeholder = `在${action.name}模式下发消息...`;
    UI.showToast(`已切换到${action.name}模式`);
  }
}
```

#### 添加辅助方法
```javascript
setSelectedButton(actionId) {
  // 清除之前的选中状态
  this.clearSelection();
  
  // 设置新的选中状态
  const btn = document.querySelector(`[data-action="${actionId}"]`);
  if (btn) {
    btn.classList.add('selected');
  }
  
  // 隐藏其他按钮
  this.hideOtherButtons(actionId);
}

clearSelection() {
  // 移除所有选中状态
  document.querySelectorAll('.action-btn.selected').forEach(btn => {
    btn.classList.remove('selected');
  });
  
  // 显示所有按钮
  this.showAllButtons();
  
  // 清空状态
  state.currentBannerMode = null;
  state.bannerPrompt = null;
}

hideOtherButtons(selectedActionId) {
  // 隐藏除选中按钮外的所有banner按钮
  const allButtons = document.querySelectorAll('.input-actions .action-btn[data-action]');
  allButtons.forEach(btn => {
    if (btn.getAttribute('data-action') !== selectedActionId) {
      btn.style.display = 'none';
    }
  });
  
  // 隐藏分隔线和快速模式按钮
  const divider = document.querySelector('.input-actions .divider');
  if (divider) divider.style.display = 'none';
  
  const quickBtn = document.getElementById('quickBtn');
  if (quickBtn) quickBtn.style.display = 'none';
}

showAllButtons() {
  // 显示所有按钮
  const allButtons = document.querySelectorAll('.input-actions .action-btn[data-action]');
  allButtons.forEach(btn => {
    btn.style.display = '';
  });
  
  // 显示分隔线和快速模式按钮
  const divider = document.querySelector('.input-actions .divider');
  if (divider) divider.style.display = '';
  
  const quickBtn = document.getElementById('quickBtn');
  if (quickBtn) quickBtn.style.display = '';
}
```

### 3. 处理"更多"菜单中的按钮
在 `createMoreDropdown` 方法中，需要确保下拉菜单中的按钮也能正确处理选中状态：
- 点击"更多"菜单中的项目时，需要找到对应的按钮并设置选中状态
- 由于"更多"菜单中的按钮不在主界面显示，需要特殊处理

## 测试要点

1. 点击"图像生成"按钮，验证：
   - 按钮显示蓝框选中样式
   - 其他按钮隐藏
   - 输入框placeholder更新

2. 再次点击"图像生成"按钮，验证：
   - 选中状态取消
   - 所有按钮恢复显示
   - 输入框placeholder恢复默认

3. 点击"更多"菜单中的按钮（如"翻译"），验证：
   - "更多"按钮显示选中样式
   - 其他按钮隐藏
   - 功能正常

4. 切换不同模式，验证状态正确切换

## 注意事项

1. 需要处理"更多"菜单中的按钮选中状态
2. 确保快速模式（快速/思考/专家）不受影响
3. 保持现有的模式切换功能不受干扰
4. 确保状态在页面刷新后正确恢复（如果需要）
