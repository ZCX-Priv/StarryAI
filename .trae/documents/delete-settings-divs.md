# 删除设置中的"默认模型"区域

## 摘要
删除设置对话框中用户选中的两个 `div`：`sec-title`（"默认模型"标题）和 `sec-row`（模型选择器下拉框），以及包裹它们的 `sec-card` 容器。

## 当前状态
文件：`src/components/modals/SettingsDialog.jsx`，第 94-105 行的 `renderModel()` 函数：

```jsx
const renderModel = () => (
  <>
    <div className="sec-title">默认模型</div>           ← 要删除
    <div className="sec-card" style={{ marginBottom: '20px' }}>  ← 要删除
      <div className="sec-row">                         ← 要删除
        <select className="model-selector" ...>         ← 要删除
          {models.map(m => (...))}                      ← 要删除
        </select>                                       ← 要删除
      </div>                                            ← 要删除
    </div>                                              ← 要删除
    <div className="sec-title">温度</div>               ← 保留
    ...
```

## 修改内容

### `src/components/modals/SettingsDialog.jsx`
- 删除第 96-105 行（`sec-title` "默认模型" + `sec-card` 包含的模型选择器 `sec-row`）
- 保留温度、Top P、上下文长度等后续内容不变

## 验证
- 启动开发服务器，打开设置对话框，确认"默认模型"标题和下拉框已消失
- 确认温度等其余设置项正常显示
