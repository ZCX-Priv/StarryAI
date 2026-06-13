# 修复 Toast 关闭按钮位置：改用直接样式覆盖

## 问题根因

之前的方案通过覆盖 sonner 的 CSS 自定义属性（`--toast-close-button-start/end/transform`）来移动关闭按钮，但**没有生效**。

原因：sonner v2 的 CSS 是在 Toaster 组件挂载时**动态注入**到 `<head>` 末尾的 style 标签中，晚于项目 index.css 的加载。同优先级下后声明的 CSS 自定义属性覆盖了我们的覆盖，导致关闭按钮仍在左上角。

## 修复方案

不再通过自定义属性间接控制，而是**直接覆盖 close button 元素的定位样式**，使用 `!important` 确保优先级最高。

### 修改文件：[index.css](file:///c:/Users/赵晨旭/Desktop/AIChat/src/index.css#L394-L400)

删除旧的不生效代码：
```css
/* Sonner toast: close button 移至右上角 */
[data-sonner-toaster][dir='ltr'],
html[dir='ltr'] {
  --toast-close-button-start: unset;
  --toast-close-button-end: 0;
  --toast-close-button-transform: translate(35%, -35%);
}
```

替换为：
```css
/* Sonner toast: close button 移至右上角 */
[data-sonner-toaster] [data-sonner-toast] [data-close-button] {
  left: unset !important;
  right: 0 !important;
  transform: translate(35%, -35%) !important;
}
```

### 验证

启动 dev server，触发 toast，确认关闭按钮在右上角。
