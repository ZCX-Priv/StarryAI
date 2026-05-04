# 模式系统实现计划（基于API文档校准 + 工具支持）

## 概述

实现三种AI响应模式：快速模式（非思考）、思考模式、专家模式（思考+ReAct+工具调用），让下拉菜单真正可用。

## API能力分析（基于 api.json）

### 关键API参数

根据Pollinations API文档，支持以下思考/推理相关参数：

#### 1. `thinking` 对象

```json
{
  "type": "enabled" | "disabled",
  "budget_tokens": 1-9007199254740991
}
```

#### 2. `reasoning_effort` 字符串

* `"none"` - 无推理

* `"minimal"` - 最小推理

* `"low"` - 低推理

* `"medium"` - 中等推理

* `"high"` - 高推理

* `"xhigh"` - 超高推理

#### 3. `thinking_budget` 整数

* 范围：0-9007199254740991

* 控制思考预算

### 支持推理的模型

* `perplexity-reasoning` - 专门的推理模型

* `deepseek-pro` - DeepSeek专业版

* `claude-opus-4.7` - Claude高级模型

* 其他模型可能也支持推理参数

### 可用工具（专家模式专用）

根据工具规范，专家模式可以调用以下工具：

#### 1. 网络搜索

```xml
<search>搜索内容</search>
```

#### 2. 图片生成

```xml
<image p="参数（使用分号分隔）">生成图片提示词</image>
```

#### 3. 音乐生成

```xml
<music p="参数（使用分号分隔）">生成音乐提示词</music>
```

#### 4. 视频生成

```xml
<video p="参数（使用分号分隔）">生成视频提示词</video>
```

**注意**：当模型在回复中提及标签时不应该将其输出为html，而应该直接替换成生成内容。

## 实现步骤

### 1. 创建模式系统架构

**位置**: `js/mode/` 文件夹

#### 1.1 创建 `js/mode/fast.js`

**快速模式 - 非思考模式**

* **用途**: 适用于大部分情况，快速响应

* **API参数**:

  ```javascript
  {
    reasoning_effort: "none",
    thinking: { type: "disabled" },
    temperature: 0.8
  }
  ```

* **特点**:

  * 直接响应，无思考过程

  * 速度最快

  * 适合常规对话和简单任务

  * 不使用工具

#### 1.2 创建 `js/mode/thinking.js`

**思考模式 - Chain of Thought**

* **用途**: 擅长解决更难的问题

* **API参数**:

  ```javascript
  {
    reasoning_effort: "high",
    thinking: { 
      type: "enabled"
    },
    temperature: 0.7
  }
  ```

* **特点**:

  * 启用思考链（Chain of Thought）

  * 显示推理过程（可选）

  * 适合复杂问题解决

  * 响应时间较长

  * 不使用工具

  * 思考预算不限制（不设置budget\_tokens）

#### 1.3 创建 `js/mode/expert.js`

**专家模式 - 思考 + ReAct + 工具调用**

* **用途**: 研究级智能模型，支持工具调用

* **API参数**:

  ```javascript
  {
    reasoning_effort: "xhigh",
    thinking: { 
      type: "enabled"
    },
    temperature: 0.6,
    model: "perplexity-reasoning" // 或其他支持推理的模型
  }
  ```

* **特点**:

  * 最高推理级别

  * 支持ReAct（推理+行动）循环

  * 支持工具调用（搜索、图片、音乐、视频）

  * 多轮推理

  * 适合研究级任务

  * 响应时间最长

  * 思考预算不限制（不设置budget\_tokens）

**工具调用流程**：

1. 模型生成包含工具标签的响应
2. 解析响应中的工具标签
3. 执行相应的工具调用
4. 将工具结果返回给模型
5. 模型继续推理直到得出最终答案

### 2. 状态管理更新

**文件**: `js/state.js`

添加新状态：

```javascript
let state = {
  // ... 现有状态
  currentMode: 'fast',  // 当前模式：'fast' | 'thinking' | 'expert'
  modeConfig: {
    fast: {
      reasoning_effort: "none",
      thinking: { type: "disabled" },
      temperature: 0.8,
      useTools: false
    },
    thinking: {
      reasoning_effort: "high",
      thinking: { type: "enabled" },
      temperature: 0.7,
      useTools: false
    },
    expert: {
      reasoning_effort: "xhigh",
      thinking: { type: "enabled" },
      temperature: 0.6,
      model: "perplexity-reasoning",
      useTools: true
    }
  }
};
```

### 3. 工具处理器实现

**文件**: `js/mode/tools.js`（新建）

```javascript
const Tools = {
  // 解析响应中的工具标签
  parseToolTags(response) {
    const tools = [];
    
    // 解析搜索标签
    const searchRegex = /<search>(.*?)<\/search>/gs;
    let match;
    while ((match = searchRegex.exec(response)) !== null) {
      tools.push({ type: 'search', query: match[1].trim() });
    }
    
    // 解析图片标签
    const imageRegex = /<image\s+p="([^"]*)">(.*?)<\/image>/gs;
    while ((match = imageRegex.exec(response)) !== null) {
      tools.push({ type: 'image', params: match[1], prompt: match[2].trim() });
    }
    
    // 解析音乐标签
    const musicRegex = /<music\s+p="([^"]*)">(.*?)<\/music>/gs;
    while ((match = musicRegex.exec(response)) !== null) {
      tools.push({ type: 'music', params: match[1], prompt: match[2].trim() });
    }
    
    // 解析视频标签
    const videoRegex = /<video\s+p="([^"]*)">(.*?)<\/video>/gs;
    while ((match = videoRegex.exec(response)) !== null) {
      tools.push({ type: 'video', params: match[1], prompt: match[2].trim() });
    }
    
    return tools;
  },
  
  // 执行工具调用
  async executeTool(tool) {
    switch (tool.type) {
      case 'search':
        return await this.executeSearch(tool.query);
      case 'image':
        return await this.executeImageGeneration(tool.params, tool.prompt);
      case 'music':
        return await this.executeMusicGeneration(tool.params, tool.prompt);
      case 'video':
        return await this.executeVideoGeneration(tool.params, tool.prompt);
      default:
        return null;
    }
  },
  
  // 执行搜索
  async executeSearch(query) {
    // 实现搜索逻辑
    // 可以调用搜索API或使用其他搜索服务
  },
  
  // 执行图片生成
  async executeImageGeneration(params, prompt) {
    const url = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?${params}`;
    return { type: 'image', url };
  },
  
  // 执行音乐生成
  async executeMusicGeneration(params, prompt) {
    const url = `https://gen.pollinations.ai/audio/${encodeURIComponent(prompt)}?${params}`;
    return { type: 'music', url };
  },
  
  // 执行视频生成
  async executeVideoGeneration(params, prompt) {
    const url = `https://gen.pollinations.ai/video/${encodeURIComponent(prompt)}?${params}`;
    return { type: 'video', url };
  },
  
  // 替换响应中的工具标签为实际内容
  replaceToolTags(response, toolResults) {
    let result = response;
    
    toolResults.forEach(({ original, replacement }) => {
      result = result.replace(original, replacement);
    });
    
    return result;
  }
};
```

### 4. API层改造

**文件**: `js/api.js`

修改 `_params` 方法：

```javascript
_params(msgs, model, stream) {
  const baseParams = {
    model: model || state.model,
    messages: Context.buildMessages(msgs),
    stream,
    seed: Math.floor(Math.random() * 2147483647)
  };
  
  // 根据当前模式添加额外参数
  const modeConfig = state.modeConfig[state.currentMode];
  
  return {
    ...baseParams,
    ...modeConfig
  };
}
```

### 5. 消息构建改造

**文件**: `js/context.js`

修改 `buildSystemPrompt` 方法：

```javascript
buildSystemPrompt() {
  // ... 现有逻辑
  
  // 根据模式加载对应的提示词
  const modePrompt = Prompts.loadModePrompt(state.currentMode);
  if (modePrompt) {
    p += `\n${modePrompt}\n`;
  }
  
  return p;
}
```

**文件**: `js/prompts.js`

添加模式提示词加载方法：
```javascript
loadModePrompt(mode) {
  // 从 prompts/mode/ 文件夹加载对应的提示词
  // mode: 'fast' | 'thinking' | 'expert'
  // 返回对应的提示词内容
  // 不需要添加任何特殊提示，直接返回提示词文件内容即可
}
```

### 6. UI交互更新

**文件**: `js/ui.js`

修改下拉菜单点击事件（已存在，需更新）：

```javascript
// 在 initDropdowns 函数中
quickMenu.querySelectorAll('.dropdown-item').forEach(item => {
  item.addEventListener('click', function() {
    const mode = this.getAttribute('data-mode'); // 'quick', 'think', 'expert'
    
    // 更新状态
    state.currentMode = mode === 'quick' ? 'fast' : mode;
    
    // 保存到本地存储
    Store.saveConfig('currentMode', state.currentMode);
    
    // 更新UI
    // ... 现有UI更新逻辑
    
    UI.closeAllDropdowns();
  });
});
```

### 7. 聊天流程集成

**文件**: `js/chat.js`

修改 `_streamResponse` 方法：

```javascript
async _streamResponse() {
  const chat = Chat.getActive();
  const msgs = chat.messages.filter(m => m.role !== 'system').map(m => ({role: m.role, content: m.content}));
  
  // 根据模式选择模型
  let modelToUse = chat.model || state.model;
  if (state.currentMode === 'expert' && state.modeConfig.expert.model) {
    modelToUse = state.modeConfig.expert.model;
  }
  
  // ... 流式响应逻辑
  
  // 如果是专家模式，处理工具调用
  if (state.currentMode === 'expert' && state.modeConfig.expert.useTools) {
    const tools = Tools.parseToolTags(fullResp);
    if (tools.length > 0) {
      // 执行工具调用
      const toolResults = [];
      for (const tool of tools) {
        const result = await Tools.executeTool(tool);
        toolResults.push(result);
      }
      
      // 替换响应中的工具标签
      fullResp = Tools.replaceToolTags(fullResp, toolResults);
      
      // 如果需要，可以将工具结果反馈给模型继续推理
      // 这里可以实现多轮ReAct循环
    }
  }
  
  // ... 其余逻辑
}
```

### 8. 本地存储

**文件**: `js/store-idb.js`

添加模式状态的持久化：

```javascript
// 在 KEYS_MAP 中添加
MODE: 'pollen_mode',

// 在加载配置时
if (savedConfig.currentMode) {
  state.currentMode = savedConfig.currentMode;
}
```

### 9. HTML更新

**文件**: `index.html`

更新下拉菜单的 `data-mode` 属性：

```html
<div class="dropdown-item active" data-mode="fast">
  <!-- 快速模式 -->
</div>
<div class="dropdown-item" data-mode="thinking">
  <!-- 思考模式 -->
</div>
<div class="dropdown-item" data-mode="expert">
  <!-- 专家模式 -->
</div>
```

## 文件结构

```
js/
├── mode/
│   ├── fast.js          # 快速模式配置和逻辑
│   ├── thinking.js      # 思考模式配置和逻辑
│   ├── expert.js        # 专家模式配置和逻辑
│   └── tools.js         # 工具处理器（搜索、图片、音乐、视频）
├── api.js               # API调用（需修改）
├── chat.js              # 聊天逻辑（需修改）
├── context.js           # 消息构建（需修改）
├── state.js             # 状态管理（需修改）
├── ui.js                # UI交互（需修改）
├── store-idb.js         # 存储（需修改）
└── config.js            # 配置（可能需要更新）
```

## 模式配置详情

### 快速模式 (fast.js)

```javascript
const FastMode = {
  name: '快速',
  description: '适用于大部分情况',
  
  getParams() {
    return {
      reasoning_effort: "none",
      thinking: { type: "disabled" },
      temperature: 0.8,
      useTools: false
    };
  },
  
  getModel(defaultModel) {
    return defaultModel;
  }
};
```

### 思考模式 (thinking.js)

```javascript
const ThinkingMode = {
  name: '思考',
  description: '擅长解决更难的问题',
  
  getParams() {
    return {
      reasoning_effort: "high",
      thinking: { 
        type: "enabled"
      },
      temperature: 0.7,
      useTools: false
    };
  },
  
  getModel(defaultModel) {
    return defaultModel;
  }
};
```

### 专家模式 (expert.js)

```javascript
const ExpertMode = {
  name: '专家',
  description: '研究级智能模型',
  
  getParams() {
    return {
      reasoning_effort: "xhigh",
      thinking: { 
        type: "enabled"
      },
      temperature: 0.6,
      useTools: true
    };
  },
  
  getModel(defaultModel) {
    return "perplexity-reasoning"; // 或其他推理模型
  }
};
```

## ReAct循环实现

专家模式支持完整的ReAct循环：

1. **Thought（思考）**: 模型分析问题，决定是否需要使用工具
2. **Action（行动）**: 模型生成工具标签（如 `<search>查询内容</search>`）
3. **Observation（观察）**: 系统执行工具调用，获取结果
4. **Iteration（迭代）**: 将工具结果反馈给模型，继续推理
5. **Final Answer（最终答案）**: 模型得出结论

示例流程：

```
用户: 帮我找一下最新的AI新闻，并生成一张相关的图片

模型（Thought）: 用户想要最新的AI新闻和相关图片。我需要先搜索AI新闻，然后生成图片。

模型（Action）: <search>最新AI新闻 2025</search>

系统（Observation）: [搜索结果：AI领域最新进展...]

模型（Thought）: 我已经获得了AI新闻信息。现在我需要生成一张相关的图片。

模型（Action）: <image p="style=realistic">AI technology news concept with neural networks and digital interface</image>

系统（Observation）: [图片已生成：https://...]

模型（Final Answer）: 根据搜索结果，最新的AI新闻包括... [显示图片]
```

## 实现优先级

1. **高优先级**: 创建三个模式文件和基础架构
2. **高优先级**: 修改API层支持思考参数
3. **高优先级**: 状态管理和本地存储
4. **高优先级**: 工具处理器实现（tools.js）
5. **中优先级**: UI集成和模式切换
6. **中优先级**: 消息构建优化
7. **中优先级**: ReAct循环实现
8. **低优先级**: 多轮ReAct循环优化

## 测试要点

* [ ] 快速模式正常工作，无推理过程

* [ ] 思考模式启用推理，reasoning\_effort为high

* [ ] 专家模式使用推理模型，reasoning\_effort为xhigh

* [ ] 专家模式工具调用正常（搜索、图片、音乐、视频）

* [ ] 工具标签正确解析和替换

* [ ] ReAct循环正常工作

* [ ] 模式切换保存正确

* [ ] UI正确显示当前模式

* [ ] 流式响应在各模式下正常

* [ ] thinking\_budget参数正确传递

* [ ] 推理令牌正确计数

## 注意事项

1. **API兼容性**: 不是所有模型都支持推理参数，需要处理不支持的情况
2. **成本控制**: 思考模式会消耗更多令牌，需要考虑成本
3. **响应时间**: 思考模式和专家模式响应时间较长，需要UI提示
4. **错误处理**: 需要处理API不支持某些参数的情况
5. **模型选择**: 专家模式可能需要特定的推理模型
6. **预算管理**: thinking\_budget需要合理设置，避免过大或过小
7. **工具调用**: 工具调用可能需要额外的API密钥或权限
8. **标签替换**: 确保工具标签正确替换为实际内容，不要输出HTML

## 可能的扩展

1. **自定义模式**: 允许用户自定义推理级别和预算
2. **自适应模式**: 根据问题复杂度自动选择模式
3. **思考过程可视化**: 在UI中显示推理过程
4. **成本估算**: 显示不同模式的预估成本
5. **工具权限**: 允许用户启用/禁用特定工具
6. **工具历史**: 记录工具调用历史，方便调试

