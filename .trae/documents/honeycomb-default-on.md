# 计划：蜂巢背景默认开启

## 问题分析

Zustand store 中 `honeycomb` 默认值为 `true`（[themeStore.js:5](file:///c:/Users/赵晨旭/Desktop/AIChat/src/status/themeStore.js#L5)），但应用初始化时，[useStore.js:56](file:///c:/Users/赵晨旭/Desktop/AIChat/src/hooks/useStore.js#L56) 的逻辑会覆盖这个默认值：

```js
useThemeStore.getState().setHoneycomb(honeycomb === true || honeycomb === 'true' || honeycomb === '1');
```

当首次使用（IndexedDB 中无保存值）时，`honeycomb` 为 `undefined`，表达式求值为 `false`，导致蜂巢背景被关闭。

## 修改方案

**文件**: `src/hooks/useStore.js` 第 56 行

将：
```js
useThemeStore.getState().setHoneycomb(honeycomb === true || honeycomb === 'true' || honeycomb === '1');
```

改为：
```js
if (honeycomb != null) {
  useThemeStore.getState().setHoneycomb(honeycomb === true || honeycomb === 'true' || honeycomb === '1');
}
```

当 IndexedDB 中没有保存过 honeycomb 配置时（首次使用），不调用 `setHoneycomb`，保留 store 中的默认值 `true`。

## 验证步骤

1. 清除浏览器 IndexedDB 数据（模拟首次使用）
2. 刷新页面，确认蜂巢背景默认显示
3. 在设置中关闭蜂巢，刷新页面，确认关闭状态被正确持久化
4. 再次开启蜂巢，刷新页面，确认开启状态被正确持久化
