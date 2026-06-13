# Loading 页面添加加载百分比计划

## 概述
在"加载中"文字旁显示资源加载百分比，基于 `useStore` 中实际的初始化步骤计算进度。

## 当前状态分析
`useStore` 初始化分为 6 个主要步骤：
1. IDB 初始化 + 数据迁移
2. 从 IndexedDB 加载数据（Promise.all，13 项）
3. 设置 Store 值 + 加载提示词
4. 加载智能体配置（fetch + IDB）
5. 加载 Banner 配置（fetch）
6. 从 API 加载模型列表

当前 `useStore` 只返回 `{ initialized, error }`，无进度信息。

## 修改方案

### 1. 修改 `src/hooks/useStore.ts`
- 返回类型增加 `progress: number`
- 新增 `progress` state，初始值 0
- 在每个主要步骤完成后更新进度：6 步，每步约 17%
- 步骤进度分配：
  - IDB init + migration 完成 → 17%
  - IDB 数据加载完成 → 33%
  - Store 值设置 + 提示词加载完成 → 50%
  - 智能体配置加载完成 → 67%
  - Banner 配置加载完成 → 83%
  - 模型列表加载完成 → 100%

### 2. 修改 `src/App.tsx`
- 从 `useStore()` 解构 `progress`
- 将 `<span className="loading-text">加载中</span>` 改为 `<span className="loading-text">加载中 {progress}%</span>`

## 验证
1. `npx tsc --noEmit` 无类型错误
2. 刷新页面观察百分比从 0% 递增到 100%
