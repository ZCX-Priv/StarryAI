# Banner 功能动态加载实现计划

## 📋 概述

将当前硬编码的banner按钮（图像生成、帮我写作、翻译、编程等功能）改为动态加载，通过配置文件和提示词文件实现灵活的功能管理。

**注意：** 快速模式选择器（快速、思考、专家）保持硬编码，不纳入本次动态加载范围。

## 🎯 目标

1. 实现banner功能的动态加载
2. 通过配置文件管理功能项
3. 每个功能对应独立的提示词文件
4. 保持现有UI风格和交互逻辑

## 📁 文件结构

```
AIChat/
├── config/
│   └── banner.json          # Banner功能配置文件
├── prompts/
│   └── banner/              # Banner提示词文件夹
│       ├── image.md         # 图像生成提示词
│       ├── write.md         # 帮我写作提示词
│       ├── translate.md     # 翻译提示词
│       ├── coding.md        # 编程提示词
│       ├── research.md      # 深入研究提示词
│       ├── podcast.md       # AI播客提示词
│       ├── meeting.md       # 记录会议提示词
│       ├── music.md         # 音乐生成提示词
│       ├── solve.md         # 解题答疑提示词
│       └── analysis.md      # 数据分析提示词
├── icons/
│   └── banner/              # Banner图标文件夹（可选，也可使用内联SVG）
└── js/
    ├── config.js            # 添加banner配置加载
    ├── ui.js                # 添加动态渲染函数
    └── banner.js            # 新建：Banner功能管理模块
```

## 📝 实现步骤

### 步骤1：创建配置文件结构

#### 1.1 创建 `config/banner.json`

```json
{
  "visibleActions": [
    {
      "id": "image",
      "name": "图像生成",
      "icon": "svg",
      "iconSvg": "<svg>...</svg>",
      "prompt": "image.md"
    },
    {
      "id": "write",
      "name": "帮我写作",
      "icon": "svg",
      "iconSvg": "<svg>...</svg>",
      "prompt": "write.md"
    }
  ],
  "moreActions": [
    {
      "id": "translate",
      "name": "翻译",
      "icon": "svg",
      "iconSvg": "<svg>...</svg>",
      "prompt": "translate.md"
    },
    {
      "id": "coding",
      "name": "编程",
      "icon": "svg",
      "iconSvg": "<svg>...</svg>",
      "prompt": "coding.md"
    },
    {
      "id": "research",
      "name": "深入研究",
      "icon": "svg",
      "iconSvg": "<svg>...</svg>",
      "prompt": "research.md"
    },
    {
      "id": "podcast",
      "name": "AI 播客",
      "icon": "svg",
      "iconSvg": "<svg>...</svg>",
      "prompt": "podcast.md"
    },
    {
      "id": "meeting",
      "name": "记录会议",
      "icon": "svg",
      "iconSvg": "<svg>...</svg>",
      "prompt": "meeting.md"
    },
    {
      "id": "music",
      "name": "音乐生成",
      "icon": "svg",
      "iconSvg": "<svg>...</svg>",
      "prompt": "music.md"
    },
    {
      "id": "solve",
      "name": "解题答疑",
      "icon": "svg",
      "iconSvg": "<svg>...</svg>",
      "prompt": "solve.md"
    },
    {
      "id": "analysis",
      "name": "数据分析",
      "icon": "svg",
      "iconSvg": "<svg>...</svg>",
      "prompt": "analysis.md"
    }
  ]
}
```

**布局规则：**
- 如果功能总数 ≤ 3个：直接显示所有按钮
- 如果功能总数 > 3个：显示前两个按钮 + "更多"下拉菜单（包含第3个及以后的所有功能）
- "更多"菜单中包含剩余的功能项

#### 1.2 创建提示词文件

每个功能创建对应的 `.md` 文件，例如 `prompts/banner/image.md`：

```markdown
你是一个专业的图像生成助手。请根据用户的需求，帮助他们生成高质量的图像描述词。

用户需求：{user_input}

请提供：
1. 优化的图像描述词
2. 建议的风格和参数
3. 可能的变体建议
```

### 步骤2：创建 Banner 管理模块

#### 2.1 创建 `js/banner.js`

```javascript
const Banner = {
  config: null,
  
  async loadConfig() {
    try {
      const response = await fetch('config/banner.json');
      this.config = await response.json();
      return true;
    } catch (error) {
      console.error('Failed to load banner config:', error);
      return false;
    }
  },
  
  async loadPrompt(promptFile) {
    if (!promptFile) return null;
    try {
      const response = await fetch(`prompts/banner/${promptFile}`);
      return await response.text();
    } catch (error) {
      console.error('Failed to load prompt:', error);
      return null;
    }
  },
  
  renderActions() {
    const allActions = [...this.config.visibleActions, ...this.config.moreActions];
    const container = document.getElementById('banner-actions');
    
    if (allActions.length <= 3) {
      // 直接显示所有按钮
      allActions.forEach(action => {
        container.appendChild(this.createActionButton(action));
      });
    } else {
      // 显示前两个 + 更多菜单
      this.config.visibleActions.slice(0, 2).forEach(action => {
        container.appendChild(this.createActionButton(action));
      });
      container.appendChild(this.createMoreDropdown(allActions.slice(2)));
    }
  },
  
  createActionButton(action) {
    // 创建单个操作按钮
  },
  
  createMoreDropdown(actions) {
    // 创建"更多"下拉菜单
  },
  
  async handleAction(actionId) {
    // 处理按钮点击，加载提示词并应用到输入
  }
};
```

### 步骤3：修改现有代码

#### 3.1 修改 `js/config.js`

添加banner配置相关的常量：

```javascript
const BANNER_CONFIG_PATH = 'config/banner.json';
const BANNER_PROMPTS_PATH = 'prompts/banner/';
```

#### 3.2 修改 `js/ui.js`

添加动态渲染banner的函数：

```javascript
renderBannerActions() {
  Banner.renderActions();
}
```

#### 3.3 修改 `js/app.js`

在应用初始化时加载banner配置：

```javascript
async enter() {
  document.getElementById('app').classList.add('visible');
  await Keys._loadModels();
  await Banner.loadConfig();  // 加载banner配置
  UI.renderBannerActions();    // 渲染banner按钮
  // ... 其他初始化代码
}
```

### 步骤4：修改 HTML 结构

#### 4.1 修改 `index.html`

将硬编码的banner按钮替换为动态容器：

```html
<div class="input-actions">
  <button class="action-btn" title="附件" id="attachBtn">
    <!-- 附件按钮保持不变 -->
  </button>
  <div class="divider"></div>
  
  <!-- 快速模式选择器保持硬编码 -->
  <div class="dropdown-wrapper quick-dropdown-wrapper">
    <!-- 快速、思考、专家选择器保持原有HTML -->
  </div>
  
  <!-- 动态渲染区域：根据配置自动判断布局 -->
  <div id="banner-actions"></div>
  
  <div class="spacer"></div>
  <!-- 发送和停止按钮保持不变 -->
</div>
```

### 步骤5：实现功能逻辑

#### 5.1 提示词应用机制

当用户点击某个功能按钮时：

1. 加载对应的提示词文件
2. 将提示词插入到输入框或作为系统消息
3. 更新输入框的placeholder提示当前模式
4. 可选：在聊天上下文中添加系统提示

#### 5.2 状态管理

在 `js/state.js` 中添加：

```javascript
state.currentBannerMode = null;
state.bannerPrompt = null;
```

### 步骤6：样式调整

确保动态生成的元素继承现有样式，可能需要在 `css/input.css` 中添加：

```css
/* 动态banner按钮样式 */
.dynamic-banner-btn {
  /* 保持与现有action-btn一致的样式 */
}
```

## 🔄 向后兼容

为确保平滑过渡：

1. 保留现有的HTML结构作为fallback
2. 如果配置加载失败，使用硬编码的按钮
3. 保持现有的CSS类名和事件处理逻辑

## 📊 配置文件格式说明

### banner.json 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 功能唯一标识符 |
| name | string | 是 | 显示名称 |
| icon | string | 是 | 图标类型（"svg" 或图片路径） |
| iconSvg | string | 条件 | 当icon为"svg"时的SVG代码 |
| description | string | 否 | 功能描述（用于下拉菜单） |
| prompt | string | 否 | 提示词文件名（相对于prompts/banner/） |

### 提示词文件格式

- 使用Markdown格式
- 可包含占位符 `{user_input}` 用于动态替换
- 可包含变量 `{variable_name}` 用于参数化

## 🧪 测试计划

1. **配置加载测试**
   - 验证banner.json正确加载
   - 测试配置文件缺失时的fallback

2. **提示词加载测试**
   - 验证各功能的提示词文件正确加载
   - 测试提示词文件缺失时的处理

3. **UI渲染测试**
   - 验证动态按钮正确渲染
   - 测试样式一致性
   - 验证响应式布局
   - **测试动态布局逻辑：**
     - 测试 ≤3 个功能时的直接显示
     - 测试 >3 个功能时的"更多"菜单显示
     - 验证"更多"菜单中的功能项完整性

4. **功能测试**
   - 测试每个功能按钮的点击响应
   - 验证提示词正确应用
   - 测试主要操作按钮和更多菜单功能

## 📦 交付物

1. `config/banner.json` - 配置文件
2. `prompts/banner/*.md` - 提示词文件（10个：image, write, translate, coding, research, podcast, meeting, music, solve, analysis）
3. `js/banner.js` - Banner管理模块（包含动态布局逻辑）
4. 修改后的 `js/config.js`, `js/ui.js`, `js/app.js`, `js/state.js`
5. 修改后的 `index.html`
6. 可选：更新的 `css/input.css`

**核心功能：**
- 自动判断功能数量，动态选择布局方式
- ≤3个功能：直接显示所有按钮
- >3个功能：显示前两个 + "更多"菜单

## ⏱️ 预估工作量

- 配置文件创建：30分钟
- 提示词文件创建：1小时
- JavaScript模块开发：2小时
- HTML/CSS调整：30分钟
- 测试和调试：1小时
- **总计：约5小时**

## 🎨 设计考虑

1. **可扩展性**：新增功能只需添加配置项和提示词文件
2. **可维护性**：配置与代码分离，便于非技术人员修改
3. **性能**：配置在应用启动时一次性加载，不影响运行时性能
4. **用户体验**：保持现有交互逻辑，用户无感知升级
