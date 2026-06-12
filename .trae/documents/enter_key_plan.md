# 回车键行为修改计划

## 需求分析

用户要求将消息输入框的回车键行为从"发送"改为"换行"，即：
- 当前行为：Enter = 发送，Shift+Enter = 换行
- 期望行为：Enter = 换行，Ctrl+Enter = 发送

## 修改内容

**文件**: `src/components/chat/InputArea.jsx`

**位置**: 第 320-325 行的 `handleKeyDown` 函数

**修改前**:
```javascript
const handleKeyDown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
};
```

**修改后**:
```javascript
const handleKeyDown = (e) => {
  if (e.key === 'Enter' && e.ctrlKey) {
    e.preventDefault();
    handleSend();
  }
};
```

## 影响分析

1. **用户体验变化**: 用户现在可以直接按 Enter 换行，需要按 Ctrl+Enter 发送消息
2. **向后兼容性**: 发送按钮仍然可用，不影响不熟悉快捷键的用户
3. **提示更新**: 建议添加提示说明新的快捷键

## 实施步骤

1. 修改 `handleKeyDown` 函数逻辑
2. 更新输入框下方的提示文字，说明 Ctrl+Enter 发送

## 验证

1. 启动开发服务器测试
2. 验证 Enter 键换行功能
3. 验证 Ctrl+Enter 发送功能
4. 验证发送按钮仍然有效