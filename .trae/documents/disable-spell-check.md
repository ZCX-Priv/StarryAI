# 计划：禁用浏览器拼写检查

## 摘要

在 Web 应用中全局禁用浏览器的拼写检查功能（红色波浪线），通过在根容器添加 `spellCheck={false}` 实现。

## 当前状态分析

* 项目中共有 9 个文本输入元素会触发浏览器拼写检查（1 个主聊天 textarea + 8 个 text input）

* **没有任何元素** 设置了 `spellCheck` 属性

* 浏览器默认对 `type="text"` 的 input 和 textarea 启用拼写检查

* 根容器位于 `AppShell.tsx` 的 `<div id="app">`，所有内容都在其内部

## 计划变更

### 1. 修改 `src/components/AppShell.tsx`

在根容器 `<div id="app">` 上添加 `spellCheck={false}` 属性。

**修改前**（约第 64 行）：

```tsx
<div id="app" ...>
```

**修改后**：

```tsx
<div id="app" spellCheck={false} ...>
```

**原理**：HTML 的 `spellcheck` 属性会向所有子元素继承，在根容器设置一次即可全局生效，无需逐个修改 9 个输入元素。

## 验证步骤

1. 启动开发服务器，打开浏览器
2. 在聊天输入框输入英文，确认不再出现红色拼写检查波浪线
3. 在设置/搜索等输入框中确认同样无拼写检查提示

