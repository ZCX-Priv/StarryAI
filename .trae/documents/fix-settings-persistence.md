# 修复：密钥和模型选择刷新后丢失

## 问题根因

`SettingsDialog.jsx` 绕过了持久化层，直接调用 Zustand Store 的方法（纯内存操作），没有将变更写入 IndexedDB。而项目已有 `useKeys`、`useModels` 等 Hook 正确实现了"更新内存 + 写入 IDB"的双重逻辑，但 SettingsDialog 完全没有使用它们。

## 受影响的 6 个功能点

| 功能 | 当前代码 | 问题 |
|------|----------|------|
| 添加密钥 | `addKey(k)` (Zustand) | 不持久化 |
| 激活密钥 | `activateKey(k)` (Zustand) | 不持久化 |
| 删除密钥 | `deleteKey(k)` (Zustand) | 不持久化 |
| 选择模型 | `setModel(id)` (Zustand) | 不持久化 |
| 温度/TopP/上下文长度 | `setTemperature/setTopP/setContextLength` (Zustand) | 不持久化 |
| 蜂巢开关 | `setHoneycomb(!honeycomb)` (Zustand) | 不持久化 |

## 修复方案

修改文件：`src/components/modals/SettingsDialog.jsx`

### 1. 引入 useKeys 和 useModels Hook

```js
import useKeys from '@/hooks/useKeys';
import useModels from '@/hooks/useModels';
```

在组件内调用：
```js
const { add: addKeyPersist, activate: activateKeyPersist, delete: deleteKeyPersist } = useKeys();
const { setModel: setModelPersist } = useModels();
```

### 2. 替换密钥操作（3处）

- `handleAddKey`: `addKey(k)` → `addKeyPersist(k)`
- `handleActivateKey`: `activateKey(k)` → `activateKeyPersist(k)`
- `handleDeleteKey`: `deleteKey(k)` → `deleteKeyPersist(k)`

同时移除不再需要的直接 store 引用：`addKey`, `deleteKey`, `activateKey` 从 `useKeyStore` 的解构中删除。

### 3. 替换模型选择（1处）

- `handleModelChange`: `setModel(id)` → `setModelPersist(id)`

移除 `setModel` 从 `useModelStore` 的解构。

### 4. 为温度/TopP/上下文长度添加持久化（3处）

在 slider 的 onChange 中增加 IDBStore 写入：

```js
onChange={e => {
  const v = parseFloat(e.target.value);
  setTemperature(v);
  IDBStore.setConfig('temperature', v);
}}
```

同理处理 `topP` 和 `contextLength`。`IDBStore` 已经在文件中导入了。

### 5. 为蜂巢开关添加持久化（1处）

```js
onClick={() => {
  const newVal = !honeycomb;
  setHoneycomb(newVal);
  IDBStore.setConfig('honeycomb', newVal);
}}
```

## 验证步骤

1. 启动开发服务器
2. 打开设置 → 密钥，添加一个密钥并激活
3. 打开设置 → 模型，选择一个模型，调整温度/TopP/上下文长度
4. 打开设置 → 外观，切换蜂巢开关
5. 刷新页面
6. 确认所有设置均保留
