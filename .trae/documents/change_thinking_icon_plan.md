## 计划：将发送框中"思考"模式的图标替换为"推理"图标

### 需求分析
用户要求将发送框中"思考"模式对应的图标，从当前的 `Layers` 图标更换为模型选择框中使用的 `Atom` 图标。

### 代码分析
- **发送框模式选择器**: `src/components/chat/ModeSelector.jsx`
  - "思考"模式当前使用 `Layers` 图标（第16行）
- **模型选择框**: `src/components/modals/ModelPickerDialog.jsx`
  - 使用 `Atom` 图标表示"推理"功能（第77行）

### 修改方案
1. 在 `ModeSelector.jsx` 中导入 `Atom` 图标
2. 将 `thinking` 模式的 `icon` 从 `Layers` 改为 `Atom`

### 文件修改
- 修改文件: `src/components/chat/ModeSelector.jsx`

### 风险评估
- 低风险：仅修改图标组件，不影响功能逻辑
- 无依赖变更

### 验证步骤
1. 修改代码后运行 `npm run build` 检查是否有构建错误
2. 运行开发服务器查看"思考"模式图标是否已更新为 Atom 图标