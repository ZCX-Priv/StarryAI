# 修复 ModelPickerDialog Hooks 顺序错误

## 问题
`ModelPickerDialog.jsx` 第12行 `if (!visible) return null;` 在 `useMemo` 之前提前返回，导致 `visible` 从 false 变为 true 时 hooks 数量不一致，触发 React 错误：
- `Rendered more hooks than during the previous render`
- `React has detected a change in the order of Hooks called`

## 修复
将 `if (!visible) return null;` 移到所有 hooks 调用之后（第20行之后）。

### 修改文件
- `src/components/modals/ModelPickerDialog.jsx`：将第12行的提前返回移到第20行（useMemo 之后）

## 验证
- 刷新页面，点击模型选择器，确认不再报错
