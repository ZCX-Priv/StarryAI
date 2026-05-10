# 对话列表按钮改进计划

## 目标
将对话列表中的删除按钮改为常显示的三个点菜单按钮，点击后显示菜单，包含编辑和删除选项。

## 当前状态分析

### 现有实现
- **按钮位置**: `js/ui.js` 第187-189行，`renderChatList()` 函数
- **按钮样式**: `css/sidebar.css` 第76-82行
- **删除逻辑**: `js/chat.js` 第27-37行，`Chat.delete()` 方法
- **模态窗样式**: `css/modals.css` 已有完整的模态窗样式
- **下拉菜单样式**: `css/input.css` 第158-203行已有下拉菜单样式

### 当前问题
1. 按钮默认隐藏（`opacity: 0`），只在hover时显示
2. 按钮显示为X图标，直接删除，无确认
3. 没有编辑对话名称的功能

## 实现步骤

### 步骤1：修改按钮样式（css/sidebar.css）
**文件**: `css/sidebar.css` 第76-82行

**修改内容**:
- 移除 `opacity: 0`，使按钮常显示
- 移除 `.chat-item:hover .ci-del { opacity: 1; }` 规则
- 将按钮类名从 `ci-del` 改为 `ci-menu-btn`（更语义化）
- 添加三个点图标的样式

**具体修改**:
```css
/* 修改前 */
.ci-del {
  opacity: 0; background: none; border: none; cursor: pointer;
  color: var(--text3); padding: 3px; border-radius: 4px;
  display: flex; align-items: center; transition: opacity .15s, color .15s; flex-shrink: 0;
}
.chat-item:hover .ci-del { opacity: 1; }
.ci-del:hover             { color: var(--danger); }

/* 修改后 */
.ci-menu-btn {
  background: none; border: none; cursor: pointer;
  color: var(--text3); padding: 4px; border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  transition: background .15s, color .15s; flex-shrink: 0;
  position: relative;
}
.ci-menu-btn:hover { background: var(--bg4); color: var(--text); }
```

### 步骤2：修改HTML结构和图标（js/ui.js）
**文件**: `js/ui.js` 第187-189行

**修改内容**:
1. 将X图标改为三个点图标（垂直排列的三个圆点）
2. 添加下拉菜单结构
3. 修改点击事件

**具体修改**:
```javascript
// 修改前
item.innerHTML=`<div class="ci-icon">...</div>
  <div class="ci-title">${Renderer.escHtml(displayTitle)}</div>
  <button class="ci-del" onclick="Chat.delete('${chat.id}',event)" title="删除">
    <svg>...</svg>
  </button>`;

// 修改后
item.innerHTML=`<div class="ci-icon">...</div>
  <div class="ci-title">${Renderer.escHtml(displayTitle)}</div>
  <button class="ci-menu-btn" onclick="Chat.toggleMenu('${chat.id}',event)" title="更多操作">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5" r="2"/>
      <circle cx="12" cy="12" r="2"/>
      <circle cx="12" cy="19" r="2"/>
    </svg>
  </button>
  <div class="ci-dropdown" id="menu-${chat.id}">
    <button class="ci-dropdown-item" onclick="Chat.openRename('${chat.id}',event)">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
      <span>编辑名称</span>
    </button>
    <button class="ci-dropdown-item ci-dropdown-danger" onclick="Chat.confirmDelete('${chat.id}',event)">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      </svg>
      <span>删除对话</span>
    </button>
  </div>`;
```

### 步骤3：添加下拉菜单样式（css/sidebar.css）
**文件**: `css/sidebar.css` 在第82行后添加

**新增样式**:
```css
/* Chat Item Dropdown Menu */
.ci-dropdown {
  position: absolute; right: 0; top: 100%;
  background: var(--bg2); border: 1px solid var(--border);
  border-radius: var(--radius); box-shadow: 0 8px 32px rgba(0,0,0,.3);
  padding: 6px; min-width: 140px; z-index: 100;
  opacity: 0; visibility: hidden; transform: translateY(-4px);
  transition: all 0.15s ease;
}
.ci-dropdown.show {
  opacity: 1; visibility: visible; transform: translateY(4px);
}
.ci-dropdown-item {
  display: flex; align-items: center; gap: 8px;
  width: 100%; padding: 8px 10px; border: none; background: none;
  border-radius: var(--radius-sm); cursor: pointer;
  font-family: var(--font); font-size: 13px; color: var(--text);
  transition: background .15s;
}
.ci-dropdown-item:hover { background: var(--bg3); }
.ci-dropdown-item svg { flex-shrink: 0; color: var(--text2); }
.ci-dropdown-danger { color: var(--danger); }
.ci-dropdown-danger svg { color: var(--danger); }
.ci-dropdown-danger:hover { background: rgba(248,113,113,.1); }
```

### 步骤4：添加菜单控制逻辑（js/chat.js）
**文件**: `js/chat.js` 在第37行后添加

**新增方法**:
```javascript
toggleMenu(id, e) {
  e.stopPropagation();
  const menu = document.getElementById(`menu-${id}`);
  if (!menu) return;
  
  // 关闭其他菜单
  document.querySelectorAll('.ci-dropdown.show').forEach(m => {
    if (m.id !== `menu-${id}`) m.classList.remove('show');
  });
  
  menu.classList.toggle('show');
},

openRename(id, e) {
  e.stopPropagation();
  const chat = state.chats.find(c => c.id === id);
  if (!chat) return;
  
  // 关闭菜单
  document.getElementById(`menu-${id}`)?.classList.remove('show');
  
  // 显示编辑模态窗
  const modal = document.getElementById('rename-modal');
  const input = document.getElementById('rename-input');
  input.value = chat.title === '新对话' ? '' : chat.title;
  modal.classList.add('visible');
  modal.dataset.chatId = id;
  input.focus();
  input.select();
},

rename() {
  const modal = document.getElementById('rename-modal');
  const input = document.getElementById('rename-input');
  const chatId = modal.dataset.chatId;
  const newTitle = input.value.trim() || '新对话';
  
  const chat = state.chats.find(c => c.id === chatId);
  if (chat) {
    chat.title = newTitle;
    Store.saveChats();
    UI.renderChatList();
    UI.updateTopbar();
  }
  
  UI.closeModal('rename-modal');
},

confirmDelete(id, e) {
  e.stopPropagation();
  
  // 关闭菜单
  document.getElementById(`menu-${id}`)?.classList.remove('show');
  
  // 显示确认对话框
  const modal = document.getElementById('confirm-delete-modal');
  modal.classList.add('visible');
  modal.dataset.chatId = id;
},

executeDelete() {
  const modal = document.getElementById('confirm-delete-modal');
  const chatId = modal.dataset.chatId;
  
  state.chats = state.chats.filter(c => c.id !== chatId);
  Store.deleteChat(chatId);
  
  if (state.activeChatId === chatId) {
    state.activeChatId = state.chats[0]?.id || null;
    if (!state.activeChatId) Chat.create();
    else Store.saveConfig('activeChatId', state.activeChatId);
  }
  
  Store.saveChats();
  UI.renderChatList();
  UI.renderMessages();
  UI.updateTopbar();
  UI.closeModal('confirm-delete-modal');
}
```

### 步骤5：添加模态窗HTML（index.html）
**文件**: `index.html` 在第270行后添加

**新增模态窗**:
```html
<!-- Rename Modal -->
<div class="modal-overlay" id="rename-modal">
  <div class="modal" style="max-width:400px">
    <div class="modal-hd">
      <span class="modal-title">编辑对话名称</span>
      <button class="icon-btn" onclick="UI.closeModal('rename-modal')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
    <div class="modal-body">
      <input type="text" id="rename-input" class="form-input" placeholder="输入对话名称..." onkeydown="if(event.key==='Enter')Chat.rename()">
    </div>
    <div class="modal-footer">
      <button class="btn-sm ghost" onclick="UI.closeModal('rename-modal')">取消</button>
      <button class="btn-sm primary" onclick="Chat.rename()">保存</button>
    </div>
  </div>
</div>

<!-- Confirm Delete Modal -->
<div class="modal-overlay" id="confirm-delete-modal">
  <div class="modal" style="max-width:360px">
    <div class="modal-hd">
      <span class="modal-title">确认删除</span>
      <button class="icon-btn" onclick="UI.closeModal('confirm-delete-modal')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
    <div class="modal-body">
      <p style="text-align:center;color:var(--text2);font-size:14px;margin:8px 0">确定要删除这个对话吗？此操作无法撤销。</p>
    </div>
    <div class="modal-footer">
      <button class="btn-sm ghost" onclick="UI.closeModal('confirm-delete-modal')">取消</button>
      <button class="btn-sm danger" onclick="Chat.executeDelete()">删除</button>
    </div>
  </div>
</div>
```

### 步骤6：添加全局点击关闭菜单逻辑（js/app.js）
**文件**: `js/app.js` 在初始化部分添加

**新增代码**:
```javascript
// 点击页面其他地方关闭聊天菜单
document.addEventListener('click', () => {
  document.querySelectorAll('.ci-dropdown.show').forEach(m => m.classList.remove('show'));
});
```

### 步骤7：更新Light主题样式（css/sidebar.css）
**文件**: `css/sidebar.css` 在第131行后添加

**新增样式**:
```css
[data-theme="light"] .ci-menu-btn:hover { background: var(--bg4); }
[data-theme="light"] .ci-dropdown { background: var(--bg2); border-color: var(--border); }
[data-theme="light"] .ci-dropdown-item:hover { background: var(--bg4); }
```

## 文件修改清单

1. **css/sidebar.css**
   - 修改第76-82行：按钮样式
   - 新增：下拉菜单样式
   - 新增：Light主题适配

2. **js/ui.js**
   - 修改第187-189行：HTML结构和图标

3. **js/chat.js**
   - 新增：`toggleMenu()` 方法
   - 新增：`openRename()` 方法
   - 新增：`rename()` 方法
   - 新增：`confirmDelete()` 方法
   - 新增：`executeDelete()` 方法

4. **index.html**
   - 新增：编辑名称模态窗
   - 新增：确认删除模态窗

5. **js/app.js**
   - 新增：全局点击关闭菜单逻辑

## 测试要点

1. ✅ 按钮常显示，不依赖hover
2. ✅ 按钮显示为三个点图标
3. ✅ 点击按钮显示下拉菜单
4. ✅ 点击"编辑名称"打开模态窗
5. ✅ 模态窗可以编辑并保存对话名称
6. ✅ 点击"删除对话"打开确认对话框
7. ✅ 确认后删除对话
8. ✅ 点击页面其他地方关闭菜单
9. ✅ Light主题下样式正确
10. ✅ 移动端响应式正常

## 注意事项

- 保持与现有代码风格一致
- 复用现有的模态窗和下拉菜单样式
- 确保移动端体验良好
- 保持键盘可访问性（Enter键确认）
