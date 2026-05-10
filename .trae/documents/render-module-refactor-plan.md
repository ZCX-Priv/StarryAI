# 渲染模块重构计划

## 目标

将现有的 `renderer.js` 中的渲染功能拆分为独立的模块化组件，支持完整的 Markdown 语法、代码高亮和 MathJax 数学公式渲染，并优化流式渲染体验。

## 当前状态分析

### 现有渲染逻辑 (`js/renderer.js`)

* 基础 Markdown 解析（标题、列表、链接、加粗、斜体等）

* 代码块高亮（使用 highlight.js）

* HTML 转义功能

* 流式渲染支持（按换行符分割，逐行渲染）

### 需要改进的问题

1. **吐字效果**：当前是按行渲染，需要改为逐字打字效果
2. **闪烁问题**：渲染时可能产生闪烁，需要优化
3. **滚动干扰**：吐字时不应强制滚动，保持用户的滚动状态
4. **缺失功能**：缺少数学公式渲染、完整 Markdown 语法支持

## 实施步骤

### 1. 创建 `js/render/` 文件夹结构

```
js/render/
├── index.js      # 主渲染器，整合所有模块
├── markdown.js   # Markdown 渲染模块
├── code.js       # 代码块渲染模块
└── formula.js    # 公式渲染模块（数学、物理、化学等）
```

### 2. 实现 `code.js` - 代码块渲染模块

**功能**：

* 使用 highlight.js 进行语法高亮

* HTML 转义处理

* 支持代码块折叠（超过 8 行）

* 复制代码功能

* 语言标签显示

**导出接口**：

```javascript
export function highlight(code, lang) {}
export function renderCodeBlock(code, lang, options) {}
export function escHtml(str) {}
```

### 3. 实现 `formula.js` - 公式渲染模块

**功能**：

* 使用 MathJax 3.x 渲染数学公式

* 支持行内公式 `$...$`

* 支持块级公式 `$$...$$`

* 支持数学、物理、化学等全套公式

* 异步渲染支持

**导出接口**：

```javascript
export function initMathJax() {}
export function renderFormula(text) {}
export function typesetFormula(element) {}
export function extractFormulas(text) {}
```

### 4. 实现 `markdown.js` - Markdown 渲染模块

**功能**：

* 完整的 Markdown 语法支持：

  * 标题（h1-h6）

  * 段落和换行

  * 加粗、斜体、删除线

  * 有序/无序列表

  * 任务列表

  * 引用块

  * 代码块（内联和多行）

  * 链接和图片

  * 表格

  * 水平分隔线

  * 脚注

* 与代码块和公式模块集成

**导出接口**：

```javascript
export function parseMarkdown(text, options) {}
export function formatText(text) {}
```

### 5. 实现 `index.js` - 主渲染器

**功能**：

* 整合所有渲染模块

* 提供统一的渲染接口

* 处理渲染顺序（先处理代码块和公式，再处理 Markdown）

* **优化流式渲染**：

  * 逐字打字效果而非逐行

  * 防闪烁机制（使用 DOM diff 或增量更新）

  * 智能滚动检测（用户滚动时不强制滚动）

**导出接口**：

```javascript
export const Renderer = {
  parseMarkdown(text, applyHljs) {},
  renderStream(text, bubble) {},
  scheduleStream(text, bubble) {},
  copyCode(id, event) {},
  toggleBlock(btn, event) {},
  toggleBlockWrap(wrap, event) {}
}
```

### 6. 流式渲染优化方案

#### 6.1 逐字打字效果

* 不再按换行符分割文本

* 使用光标位置跟踪当前渲染位置

* 实时更新 DOM 内容

#### 6.2 防闪烁机制

* 使用 `requestAnimationFrame` 确保渲染在浏览器帧同步

* 对已渲染内容进行缓存，避免重复渲染

* 使用 CSS 过渡效果平滑更新

#### 6.3 智能滚动处理

* 保持现有的 `state.autoScroll` 机制

* 用户手动滚动时，`autoScroll` 自动设为 false

* 只有 `autoScroll` 为 true 时才滚动到底部

* 渲染过程不干扰用户滚动

### 7. 更新 `index.html`

* 添加 MathJax CDN 引用

* 添加新的渲染模块脚本引用

**添加内容**：

```html
<!-- MathJax -->
<script>
window.MathJax = {
  tex: {
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']],
    processEscapes: true
  },
  svg: { fontCache: 'global' },
  startup: {
    pageReady: () => {
      return MathJax.startup.defaultPageReady();
    }
  }
};
</script>
<script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js" async></script>
```

### 8. 更新 `prompts/soul.md`

在文件末尾添加输出格式说明：

````markdown
# 输出格式说明

## 代码块
使用三个反引号包裹代码，并指定语言：
```语言名
代码内容
````

## 数学公式

* 行内公式：使用单个美元符号包裹，如 $E=mc^2$

* 块级公式：使用双美元符号包裹，如 $$\int\_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}$$

支持数学、物理、化学等所有 LaTeX 公式语法。

## 物理公式示例

* 力学：$F = ma$

* 电磁学：$\nabla \cdot \mathbf{E} = \frac{\rho}{\varepsilon\_0}$

* 量子力学：$\hat{H}\psi = E\psi$

## 化学公式示例

* 化学方程式：$$2H\_2 + O\_2 \xrightarrow{\text{点燃}} 2H\_2O$$

* 有机化学：$\ce{CH3COOH}$

```

### 9. 更新 `js/renderer.js`
- 重构为使用新的模块化渲染器
- 保持向后兼容的 API
- 实现新的流式渲染逻辑

## 技术细节

### MathJax 配置
- 使用 TeX 输入，SVG 输出
- 支持所有 LaTeX 数学命令
- 自动识别 `$...$` 和 `$$...$$` 语法
- 异步加载，不阻塞页面渲染

### 渲染流程
1. 预处理：提取代码块和数学公式，用占位符替换
2. Markdown 解析：处理文本内容
3. 后处理：将代码块和公式还原并渲染
4. MathJax 排版：异步渲染数学公式

### 流式渲染流程（优化后）
1. 接收文本流
2. 检测未闭合的代码块或公式
3. 对已完成部分进行完整渲染
4. 对进行中部分显示原始内容（带打字光标效果）
5. 使用 `requestAnimationFrame` 节流
6. 只在 `autoScroll` 为 true 时滚动

### 防闪烁策略
1. 使用 `stable` 和 `live` 两个区域分离已确认内容和流式内容
2. 对 `stable` 区域内容进行缓存，只在内容变化时更新
3. 使用 CSS `contain` 属性优化重绘范围
4. 避免在渲染过程中频繁操作 DOM

## 文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `js/render/code.js` | 新建 | 代码块渲染模块 |
| `js/render/formula.js` | 新建 | 公式渲染模块 |
| `js/render/markdown.js` | 新建 | Markdown 渲染模块 |
| `js/render/index.js` | 新建 | 主渲染器入口 |
| `js/renderer.js` | 重构 | 使用新模块 |
| `index.html` | 修改 | 添加 MathJax 和模块引用 |
| `prompts/soul.md` | 修改 | 添加输出格式说明 |

## 风险和注意事项

1. **MathJax 加载时机**：确保 MathJax 在渲染前已加载完成
2. **性能考虑**：大量公式可能影响渲染性能，需要优化
3. **向后兼容**：保持现有 API 不变，避免影响其他模块
4. **流式渲染**：公式在流式输出中可能显示不完整，需要特殊处理
5. **滚动体验**：确保用户滚动时不被强制跳转
6. **闪烁问题**：使用 DOM diff 和增量更新避免闪烁
```

