# 设置项标签页顺序调整计划

## 目标
将设置模态框中的标签页顺序从"密钥、外观"调整为"外观、密钥"，并默认显示"外观"标签页。

## 需要修改的文件

### 1. index.html
**位置**: 第225-228行

**当前代码**:
```html
<div class="modal-tabs">
  <button class="modal-tab active" id="tab-keys" onclick="Modals.switchTab('keys')"><span id="txt-tab-keys">密钥</span></button>
  <button class="modal-tab" id="tab-appearance" onclick="Modals.switchTab('appearance')"><span id="txt-tab-appearance">外观</span></button>
</div>
```

**修改内容**:
- 交换两个按钮的顺序
- 将 `active` 类从 `tab-keys` 移到 `tab-appearance`

**修改后代码**:
```html
<div class="modal-tabs">
  <button class="modal-tab active" id="tab-appearance" onclick="Modals.switchTab('appearance')"><span id="txt-tab-appearance">外观</span></button>
  <button class="modal-tab" id="tab-keys" onclick="Modals.switchTab('keys')"><span id="txt-tab-keys">密钥</span></button>
</div>
```

### 2. js/state.js
**位置**: 第17行

**当前代码**:
```javascript
settingsTab:   'keys',
```

**修改内容**:
- 将默认标签页改为 'appearance'

**修改后代码**:
```javascript
settingsTab:   'appearance',
```

## 实施步骤

1. 修改 `index.html` 中的标签页按钮顺序和默认激活状态
2. 修改 `js/state.js` 中的默认标签页设置
3. 启动服务器验证修改效果

## 注意事项
- `modals.js` 中的 `switchTab` 和 `renderSettings` 函数无需修改，它们已经支持根据 `state.settingsTab` 的值动态渲染内容
- 标签页的 ID 和 onclick 事件保持不变，只是顺序和默认激活状态改变
