# 修改密钥输入框 Placeholder

## Summary
将设置 > 密钥中的输入框 placeholder 从 `pk_…` 改为 `sk/pk_......`

## Current State
- 文件：`src/components/modals/SettingsDialog.tsx` 第170行
- 当前值：`placeholder="pk_…"`

## Proposed Changes
- **文件**：`src/components/modals/SettingsDialog.tsx`
- **修改**：将第170行的 `placeholder="pk_…"` 改为 `placeholder="sk/pk_......"`
- **原因**：用户要求，且与 `api.ts` 中密钥校验逻辑 `^(pk_|sk_)` 一致，提示应同时包含 sk 和 pk 前缀

## Verification
- 检查修改后页面显示是否正确
