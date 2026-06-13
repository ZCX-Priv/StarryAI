# Banner 功能迁移后失效修复计划

## 问题根因

`banner.json` 的实际字段与迁移后的 TypeScript 类型定义不匹配：

| JSON 实际字段 | 类型定义字段 | 影响 |
|---|---|---|
| `prompt` | `promptFile` | `loadPrompt(action.promptFile)` 传入 `undefined`，导致 prompt 加载失败 |
| `name` | `label` | 名称显示可能异常 |
| `iconSvg` | `icon` | 图标渲染可能异常 |

关键调用链：`InputArea.handleBannerClick` → `useBanner.handleAction(action)` → `loadPrompt(action.promptFile)` → `action.promptFile` 为 `undefined` → 直接返回 `null` → banner 切换无效。

## 修复方案

将类型定义与 `banner.json` 实际数据对齐，修改以下文件：

### 1. `src/types/index.ts` — 修改 `BannerAction` 接口
```typescript
// 修改前
export interface BannerAction {
  id: string;
  label: string;
  icon: string;
  promptFile: string;
  mode?: string;
}

// 修改后
export interface BannerAction {
  id: string;
  name: string;
  icon: string;
  iconSvg: string;
  prompt: string;
  mode?: string;
}
```

### 2. `src/status/modeStore.ts` — 无需修改
`BannerConfig` 引用 `BannerAction`，会自动跟随类型更新。

### 3. `src/hooks/useBanner.ts` — 修改字段引用
- `action.promptFile` → `action.prompt`
- `action.label` → `action.name`
- `createActionButton` 返回值中 `name: action.label` → `name: action.name`

### 4. `src/components/chat/InputArea.tsx` — 修改 `BannerActionItem` 接口
```typescript
// 修改前
interface BannerActionItem {
  id: string;
  name: string;
  iconSvg: string;
  promptFile: string;
  mode?: string;
}

// 修改后
interface BannerActionItem {
  id: string;
  name: string;
  icon: string;
  iconSvg: string;
  prompt: string;
  mode?: string;
}
```
- `handleBannerClick` 中 `action as unknown as Parameters<typeof handleAction>[0]` 可简化为直接传 `action`（因为类型现在一致）

## 验证步骤

1. `npx tsc --noEmit` 零错误
2. `npm run build` 成功
3. `npm run dev` → 点击 banner 按钮 → prompt 正确加载 → 模式切换生效
