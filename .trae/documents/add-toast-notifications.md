# 计划：为必要操作添加 Toast 提示

## 概述

项目已使用 `sonner` 库作为 toast 系统，`uiStore.showToast(msg, type)` 支持 `success`/`error`/`warning`/`info` 四种类型。当前已有 22 处 `showToast` 调用，但存在两类问题：
1. **现有调用未区分类型** — 错误/验证/删除等场景全部默认 `success`，语义不准确
2. **关键操作缺少提示** — 切换模型、切换模式、重命名保存、API 错误等无反馈

## 修改清单

### 一、修正现有 showToast 的类型参数

| 文件 | 当前调用 | 修改为 |
|------|---------|--------|
| `src/components/agents/AgentsPage.jsx:83` | `showToast('删除失败，请重试')` | `showToast('删除失败，请重试', 'error')` |
| `src/components/agents/AgentsPage.jsx:99` | `showToast('删除失败，请重试')` | `showToast('删除失败，请重试', 'error')` |
| `src/components/agents/CreateAgentDialog.jsx:21` | `showToast('请输入1-20个字符的智能体名称')` | `showToast('请输入1-20个字符的智能体名称', 'warning')` |
| `src/components/agents/CreateAgentDialog.jsx:25` | `showToast('请输入10-2000个字符的角色定义')` | `showToast('请输入10-2000个字符的角色定义', 'warning')` |
| `src/components/agents/CreateAgentDialog.jsx:54` | `showToast('创建失败，请重试')` | `showToast('创建失败，请重试', 'error')` |
| `src/components/agents/CreateCategoryDialog.jsx:14` | `showToast('请输入1-10个字符的分类名称')` | `showToast('请输入1-10个字符的分类名称', 'warning')` |
| `src/components/agents/CreateCategoryDialog.jsx:21` | `showToast('该分类名称已存在')` | `showToast('该分类名称已存在', 'warning')` |
| `src/components/agents/CreateCategoryDialog.jsx:50` | `showToast('创建失败，请重试')` | `showToast('创建失败，请重试', 'error')` |
| `src/components/modals/SettingsDialog.jsx:51` | `showToast('密钥已删除')` | `showToast('密钥已删除', 'info')` |
| `src/components/modals/ConfirmDeleteDialog.jsx:13` | `showToast('对话已删除')` | `showToast('对话已删除', 'info')` |
| `src/components/agents/AgentsPage.jsx:81` | `showToast('智能体已删除')` | `showToast('智能体已删除', 'info')` |
| `src/components/agents/AgentsPage.jsx:96` | `showToast('分类已删除')` | `showToast('分类已删除', 'info')` |
| `src/context/memory.js:75` | `showToast('记忆已清除')` | `showToast('记忆已清除', 'info')` |
| `src/context/memory.js:86` | `showToast('记忆已删除')` | `showToast('记忆已删除', 'info')` |

### 二、新增缺失的 Toast 提示

#### 1. `src/components/modals/ModelPickerDialog.jsx`
- **切换模型**：`handleSelect(id)` 中添加 `showToast(`已切换到 ${modelName}`, 'success')`

#### 2. `src/components/chat/ModeSelector.jsx`
- **切换对话模式**（快速/思考/专家）：`handleSelect(modeId)` 中添加 `showToast(`已切换到${mode.label}模式`, 'success')`

#### 3. `src/components/modals/RenameDialog.jsx`
- **重命名保存**：`handleRename()` 中 `onClose()` 前添加 `showToast('名称已保存', 'success')`

#### 4. `src/components/modals/MemoryDialog.jsx`
- **编辑记忆保存**：`MemoryItem.handleSave()` 中添加 `showToast('记忆已更新', 'success')`

#### 5. `src/components/modals/SettingsDialog.jsx`
- **切换主题**：`apply(th)` 后添加 `showToast('主题已切换', 'success')`
- **切换蜂巢背景**：`setHoneycomb(v)` 后添加 `showToast(v ? '已开启动态蜂巢' : '已关闭动态蜂巢', 'info')`

#### 6. `src/components/chat/InputArea.jsx`
- **API 流式请求失败**：catch 块中添加 `showToast('请求失败，请重试', 'error')`（在 `addMessage` 之前）

#### 7. `src/components/chat/ChatArea.jsx`
- **API 重新生成失败**：catch 块中添加 `showToast('重新生成失败', 'error')`

#### 8. `src/components/chat/MessageActions.jsx`
- **复制失败**：catch 块中添加 `showToast('复制失败', 'error')`

#### 9. `src/services/api.js`
- **401/403 认证错误**：`streamAPI` 和 `fetchAPI` 中 401/403 分支添加 `showToast('API 密钥无效或已过期', 'error')`

### 三、不做修改的场景（理由）

| 场景 | 理由 |
|------|------|
| 新建对话 | 用户可从侧边栏直接看到新对话出现，无需额外提示 |
| 切换对话 | 用户主动点击切换，视觉反馈已足够 |
| 滑块参数调整 | 实时生效，滑块本身有数值显示，toast 会过于频繁 |
| 停止生成 | 用户主动操作，UI 按钮状态变化已提供反馈 |
| 附件按钮 | 功能未实现，不应添加提示 |

## 验证步骤

1. `npm run build` 确认无编译错误
2. `npm run dev` 启动开发服务器
3. 逐一测试以下操作，确认 toast 正确显示：
   - 切换模型 → 绿色成功提示
   - 切换对话模式 → 绿色成功提示
   - 重命名对话 → 绿色成功提示
   - 切换主题 → 绿色成功提示
   - 切换蜂巢背景 → 蓝色信息提示
   - 删除对话/智能体/分类/密钥/记忆 → 蓝色信息提示
   - 表单验证失败 → 黄色警告提示
   - API 错误 → 红色错误提示
