# 移除 i18n 国际化功能计划

## 概述
将项目中的 i18n 国际化功能删除，并将所有文字直接改为中文。

## 涉及的文件

### 1. 需要删除的文件
- `js/i18n-strings.js` - 包含多语言翻译字符串和 I18n 对象

### 2. 需要修改的文件

#### `index.html`
- 移除 `<script src="js/i18n-strings.js"></script>` 引用
- 将所有占位符文本直接改为中文：
  - `txt-new-chat`: "Novo Chat" → "新对话"
  - `txt-chats-label`: "Conversas" → "对话"
  - `txt-settings`: "Configurações" → "设置"
  - `txt-scroll-down`: "Ir para o fim" → "滚动到底部"
  - `stream-status-text`: "Gerando resposta…" → "正在生成回复…"
  - `msg-input` placeholder: "Mensagem..." → "消息..."
  - `txt-input-hint`: "as respostas podem conter erros" → "回复可能包含错误"
  - `txt-settings-title`: "Configurações" → "设置"
  - `txt-tab-keys`: "Chaves" → "密钥"
  - `txt-tab-appearance`: "Aparência" → "外观"
  - `txt-memory-title`: "Memória" → "记忆"
  - `txt-clear-memory`: "Limpar Tudo" → "全部清除"
  - `txt-close`: "Fechar" → "关闭"
  - `txt-help-title`: "Central de Ajuda" → "帮助中心"
  - `txt-help-close`: "Fechar" → "关闭"
  - `txt-model-picker-title`: "Modelo" → "选择模型"

#### `js/app.js`
- 移除 `I18n.load();` 调用

#### `js/renderer.js`
- `t('showMore')` → "展开"
- `t('copied')` → "已复制！"
- `t('showLess')` → "收起"

#### `js/ui.js`
- `t('streamCode')` → "正在生成代码…"
- `t('streamText')` → "正在生成回复…"
- `t('showAll')` → "查看全部"
- `t('regen')` → "重新生成"
- `t('copy')` → "复制"
- `t('newChatTitle')` → "新对话"
- `t('emptyTitle')` → "我能帮您什么？"
- `t('emptyDesc')` → "开始对话，模型会自动了解您。"
- `t('deleteChat')` → "删除"

#### `js/keys.js`
- `t('keySaved')` → "密钥已保存！"
- `t('keyDeleted')` → "密钥已删除"

#### `js/modals.js`
- `t('poweredBy')` → "由"
- `t('pollinationsDesc')` → "免费开源 AI API"
- `t('keysSection')` → "管理密钥"
- `t('noKeySaved')` → "未保存密钥。"
- `t('activeKey')` → "已激活"
- `t('inactiveKey')` → "未激活"
- `t('useKey')` → "使用"
- `t('keyPlaceholder')` → "pk_…"
- `t('addKey')` → "添加"
- `t('themeLabel')` → "主题"
- `t('themeAuto')` → "自动"
- `t('themeDark')` → "深色"
- `t('themeLight')` → "浅色"
- `t('bgSection')` → "背景"
- `t('honeycombLabel')` → "动态蜂巢"
- `t('honeycombDesc')` → "聊天界面背景装饰画布"
- `t('currentModel')` → "默认模型"
- `t('noMemory')` → "尚无保存的记忆。"
- `t('memoryDesc')` → "AI 在对话过程中自动学习您的偏好。"
- `t('helpMemoryTitle')` → "记忆功能介绍"
- `t('helpMemoryText')` → "AI 会在对话中自动学习关于您的有用信息，包括姓名、偏好、沟通风格和兴趣。这些记忆保存在本地，用于个性化回复。您可以通过顶栏的大脑图标或侧栏"记忆"查看、编辑或删除任何记忆。"
- `t('helpModelsTitle')` → "切换模型"
- `t('helpModelsText')` → "您可以通过顶栏的模型选择器或在设置→外观→模型中切换 AI 模型。"fast"模型速度更快，大型模型生成的回复更详细。"
- `t('helpAppearanceTitle')` → "自定义外观"
- `t('helpAppearanceText')` → "在设置→外观中，您可以切换主题（自动、深色或浅色），并开启或关闭聊天背景的蜂巢装饰画布。自动主题跟随系统设置。"
- `t('helpKeysTitle')` → "管理密钥"
- `t('helpKeysText')` → "公钥（pk_...）是通过 Pollinations.ai 使用 AI 的必要凭证。请访问 enter.pollinations.ai 获取。在设置→密钥中，您可以添加多个密钥、激活不同密钥或删除旧密钥。"

#### `js/chat.js`
- `t('newChatTitle')` → "新对话"
- `t('copied')` → "已复制！"

#### `js/memory.js`
- `t('memCleared')` → "记忆已清除"
- `t('memDeleted')` → "记忆已删除"

## 执行步骤

1. 修改 `index.html`：
   - 移除 i18n-strings.js 脚本引用
   - 将所有文本改为中文

2. 修改 `js/app.js`：
   - 移除 I18n.load() 调用

3. 修改 `js/renderer.js`：
   - 将所有 t() 调用替换为中文字符串

4. 修改 `js/ui.js`：
   - 将所有 t() 调用替换为中文字符串

5. 修改 `js/keys.js`：
   - 将所有 t() 调用替换为中文字符串

6. 修改 `js/modals.js`：
   - 将所有 t() 调用替换为中文字符串

7. 修改 `js/chat.js`：
   - 将所有 t() 调用替换为中文字符串

8. 修改 `js/memory.js`：
   - 将所有 t() 调用替换为中文字符串

9. 删除 `js/i18n-strings.js` 文件
