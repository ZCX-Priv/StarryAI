# Toast 组件升级计划

## 摘要
将当前简陋的自定义 toast 替换为美观的 `sonner` 库，动画改为从顶部降下。

## 当前状态分析
- **实现方式**：完全自定义，无第三方库
- **状态管理**：Zustand store (`src/status/uiStore.js`) 中的 `toastMessage`/`toastVisible`/`showToast`
- **视图层**：`AppShell.jsx` 中一个简单的 `<div id="toast">`
- **样式**：`index.css` 中固定在底部、从下方滑入的 CSS
- **调用点**：8 个文件约 20 处调用，通过 `useUiStore(s => s.showToast)` 或 `useUiStore.getState().showToast()`

## 方案选择：使用 `sonner`

选择 `sonner` 的理由：
- 轻量（~3KB gzipped）、美观、开箱即用
- 原生支持从顶部降下的动画
- 支持多种类型（success/error/warning/info）和图标
- 支持队列（多条 toast 不会互相覆盖）
- 与 Tailwind CSS 兼容性好
- shadcn/ui 的官方 toast 方案

## 具体修改

### 1. 安装 sonner
```bash
npm install sonner
```

### 2. 修改 `src/status/uiStore.js`
- 移除 `toastMessage`、`toastVisible` 状态
- 修改 `showToast` 方法，直接调用 `sonner` 的 `toast()` 函数
- 支持类型参数：`showToast(msg, type?)`，type 可选 'success' | 'error' | 'warning' | 'info'

```js
import { toast } from 'sonner';

// 移除:
// toastMessage: null,
// toastVisible: false,

// 替换 showToast:
showToast: (msg, type = 'success') => {
  const fn = toast[type] || toast;
  fn(msg);
},
```

### 3. 修改 `src/components/layout/AppShell.jsx`
- 移除 `toastMessage`/`toastVisible` 的 store 读取
- 移除 `<div id="toast">` 元素
- 在组件顶层添加 `<Toaster />` 组件（sonner 提供）

```jsx
import { Toaster } from 'sonner';

// 在 return 的 JSX 中添加:
<Toaster position="top-center" richColors closeButton />
```

### 4. 修改 `src/index.css`
- 删除 `#toast` 和 `#toast.show` 的 CSS 规则（第 392-394 行附近）

### 5. 调用点适配（8 个文件）
所有调用点**无需修改**，因为 `showToast(msg)` 的签名保持兼容。
如需利用新功能（如错误类型），可选择性升级部分调用：
- `src/context/memory.js`：`showToast('记忆已清除')` → `showToast('记忆已清除', 'success')`
- `src/components/modals/SettingsDialog.jsx`：密钥删除 → `showToast('密钥已删除', 'error')`
- 其余保持默认即可（默认为 success 类型）

## 假设与决策
- **动画方向**：从顶部降下（`position="top-center"`），符合用户要求
- **richColors**：启用，让不同类型的 toast 有不同颜色
- **closeButton**：启用，用户可手动关闭
- **保持 API 兼容**：`showToast(msg)` 签名不变，减少改动范围
- **不使用 shadcn/ui 的 toast 封装**：因为项目未安装 shadcn/ui，直接用 sonner 更轻量

## 验证步骤
1. `npm run build` 无报错
2. 启动开发服务器，页面正常渲染
3. 触发 toast（如复制消息、删除对话等），确认：
   - 从顶部降下动画
   - 美观的样式和图标
   - 多条 toast 排队显示
   - 可手动关闭
