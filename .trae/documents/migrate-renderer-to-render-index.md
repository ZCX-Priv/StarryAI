# 删除 renderer.js 并迁移到 render/index.js 实施计划

## 背景

当前项目结构：
- `js/renderer.js` - 定义了 `Renderer` 对象，作为主要渲染协调器
- `js/render/index.js` - 目前只是一个初始化模块，仅初始化 FormulaRenderer
- `js/render/code.js` - CodeRenderer，处理代码块
- `js/render/formula.js` - FormulaRenderer，处理公式
- `js/render/markdown.js` - MarkdownRenderer，处理 Markdown

`Renderer` 对象被多个文件使用：
- `js/chat.js` - 调用 `Renderer.parseMarkdown()`, `Renderer.scheduleStream()`, `Renderer.escHtml()`
- `js/ui.js` - 调用 `Renderer.parseMarkdown()`, `Renderer.escHtml()`
- `js/modals.js` - 调用 `Renderer.escHtml()`
- `js/render/code.js` - 在 onclick 中引用 `Renderer.toggleBlock()`, `Renderer.toggleBlockWrap()`, `Renderer.copyCode()`

## 实施步骤

### 步骤 1：合并文件内容

将 `js/renderer.js` 中的 `Renderer` 对象定义合并到 `js/render/index.js` 中。

**操作**：编辑 `js/render/index.js`，将 `Renderer` 对象定义添加到文件中，保留原有的 `RenderModule.init()` 逻辑。

### 步骤 2：更新 HTML 引用

从 `index.html` 中移除对 `js/renderer.js` 的引用。

**操作**：删除 `index.html` 第 381 行的 `<script src="js/renderer.js"></script>`

### 步骤 3：删除 renderer.js 文件

删除不再需要的 `js/renderer.js` 文件。

**操作**：删除文件 `js/renderer.js`

### 步骤 4：验证

确保所有功能正常工作，无报错。

## 文件变更清单

| 文件 | 操作 |
|------|------|
| `js/render/index.js` | 编辑：合并 Renderer 对象定义 |
| `index.html` | 编辑：移除 renderer.js 引用 |
| `js/renderer.js` | 删除 |

## 风险评估

- **低风险**：这是一个简单的文件合并操作，不改变任何逻辑
- `Renderer` 对象通过 `window.Renderer` 或全局作用域访问，合并后访问方式不变
- 加载顺序不变（render/index.js 已在正确位置加载）
