# NodeJS 迁移项目 - 最终检查与修复计划

## 检查结果

### 项目整体状态
- 文件完整性：**完整** — 所有 25 个组件、12 个 Hooks、4 个 Context 模块、3 个 Service 均已创建
- Context 系统：**完整实现** — systemPrompt / memory / time 三个模块功能齐全
- 公共资源：**完整** — logo.png 和 agents/ 头像均已复制
- `npm run build`：**已通过**

### 需要修复的问题

#### 严重问题（会导致运行时错误）

1. **缺失 `clsx` 依赖**
   - `src/lib/utils.js` 导入了 `clsx`，但 `package.json` 中未声明
   - 修复：`npm install clsx`

2. **fetch 路径错误 — `/data/` 目录不存在**
   - `useAgents.js` 第12行 `fetch('/data/agents.json')` → public 下无 `data/` 子目录
   - `useBanner.js` 第11行 `fetch('/data/banner.json')` → 同上
   - `useStore.js` 第71行、第102行也有同样问题
   - 修复方案：将 `src/data/` 复制到 `public/data/`，或改用 `import` 静态导入 JSON

3. **fetch 路径错误 — `/prompts/` 目录不存在**
   - `useAgents.js` 第49行 `fetch('/prompts/agents/${promptFile}')` → public 下无 `prompts/` 文件夹
   - `useBanner.js` 第25行 `fetch('/prompts/banner/${promptFile}')` → 同上
   - 修复方案：提示词已在 `src/prompts/` 下，应改用 Vite `?raw` 导入（与 `lib/prompts.js` 一致），或将 prompts 复制到 public

#### 中等问题（不影响运行但应清理）

4. **`react-router-dom` 未使用**
   - 已安装但项目中没有任何文件导入使用
   - 修复：`npm uninstall react-router-dom`

5. **重复初始化逻辑**
   - `App.jsx` 的 useEffect 和 `useStore.js` hook 都执行了 IDB 初始化、配置加载等
   - 修复：移除 App.jsx 中的重复逻辑，统一由 useStore hook 处理

6. **`src/App.css` 残留文件**
   - Vite 脚手架生成，未被任何文件导入
   - 修复：删除

#### 轻微问题

7. **HTML 标题未修改**
   - `index.html` 的 `<title>` 为 "nodejs"，应改为 "星语"

8. **`components.json` 残留**
   - shadcn/ui 配置文件存在，但项目未使用 shadcn/ui 组件
   - 可保留（为将来扩展用）或删除

## 修复步骤

### 步骤 1：安装缺失依赖 + 移除未使用依赖
```powershell
cd NodeJS
npm install clsx
npm uninstall react-router-dom
```

### 步骤 2：修复 fetch 路径问题
- 将 `src/data/agents.json` 和 `src/data/banner.json` 复制到 `public/data/` 目录
- 将 `src/prompts/` 目录复制到 `public/prompts/` 目录
- 这样 fetch 路径 `/data/agents.json`、`/data/banner.json`、`/prompts/agents/`、`/prompts/banner/` 就能正常工作

### 步骤 3：修复重复初始化
- 简化 App.jsx，移除与 useStore 重复的初始化逻辑

### 步骤 4：清理残留文件
- 删除 `src/App.css`
- 修改 `index.html` 标题为 "星语"

### 步骤 5：验证
- 运行 `npm run dev` 启动开发服务器
- 检查页面是否正常渲染
- 修复任何运行时错误

## 验证清单
- [ ] `npm run dev` 启动无报错
- [ ] 页面正常渲染（侧边栏、顶栏、聊天区域）
- [ ] 主题切换正常
- [ ] API Key 管理正常
- [ ] 模型加载正常
- [ ] 智能体广场加载正常
- [ ] 聊天发送和流式响应正常
- [ ] 记忆系统正常
- [ ] `npm run build` 构建成功
