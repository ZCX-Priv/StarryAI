# 清除 CDN 引入资源计划

## 摘要

经全面扫描，项目中共发现 **1 处** CDN 资源引入，位于 `src/index.css` 中通过 `@import` 从 Google Fonts CDN 加载 Inter 字体。用户决策：通过 npm 安装 `@fontsource/inter` 替代 CDN 引入。

## 当前状态分析

### 发现的 CDN 引用

| 文件 | 位置 | 内容 | 类型 |
|------|------|------|------|
| [src/index.css](file:///c:/Users/赵晨旭/Desktop/AIChat/src/index.css#L1) | 第 1 行 | `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');` | Google Fonts CDN |

### 排除项说明

以下情况经确认 **不属于** CDN 引入资源包：
- `index.html` 中无任何 `<script src="cdn...">` 或 `<link href="cdn...">` 标签。
- `package.json` 中所有依赖均通过 npm 管理，无 CDN 形式的包引入。
- 代码中的 `fetch` 调用均为本地静态资源（`/data/*.json`、`/prompts/*`）或后端 API 请求，非第三方 CDN 资源。

## 拟变更内容

### 方案：npm 引入 `@fontsource/inter`

#### 步骤 1：安装依赖

```bash
npm install @fontsource/inter
```

#### 步骤 2：在入口文件引入字体

修改 `src/main.tsx`，在顶部添加所需字重的 import：

```typescript
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
```

（`@fontsource/inter` 会自动通过 Vite 处理字体文件，无需手动配置 `@font-face`）

#### 步骤 3：删除 CDN `@import`

修改 `src/index.css`，**删除**第 1 行：

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
```

保留现有的 `--font` CSS 变量定义，无需修改：

```css
--font: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
```

## 验证步骤

1. **构建检查**：执行 `npm run build`，确认构建成功，无 CSS 解析错误。
2. **视觉检查**：启动开发服务器 `npm run dev`，检查各页面文本渲染是否正常，字重（300/400/500/600）是否正确加载。
3. **网络检查**：打开浏览器开发者工具 → Network 面板，确认页面加载时无任何向 `fonts.googleapis.com` 或 `fonts.gstatic.com` 的请求。
4. **离线检查**：断开网络后刷新页面，确认字体仍能正常渲染。
