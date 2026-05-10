# 将 main.md 重命名为 soul.md 的实施计划

## 任务概述
将项目中加载的 `main.md` 文件改名为 `soul.md`，内容保持不变。

## 需要修改的文件

### 1. 文件重命名
- **原文件**: `prompts/main.md`
- **新文件**: `prompts/soul.md`
- **操作**: 将文件重命名，内容保持不变

### 2. 代码引用修改
**文件**: `js/prompts.js`

需要修改的位置：
- **第 5 行**: `fetch('prompts/main.md')` → `fetch('prompts/soul.md')`
- **第 7 行**: console.warn 中的 `'Failed to load main.md, using fallback'` → `'Failed to load soul.md, using fallback'`
- **第 14 行**: console.warn 中的 `'Error loading main.md:'` → `'Error loading soul.md:'`

## 实施步骤

1. **重命名文件**
   - 将 `prompts/main.md` 重命名为 `prompts/soul.md`

2. **更新代码引用**
   - 在 `js/prompts.js` 中更新所有对 `main.md` 的引用为 `soul.md`
   - 共 3 处需要修改

## 影响范围
- 仅影响 `prompts.js` 文件中的 `loadMainPrompt()` 函数
- 不影响文件内容本身
- 不影响其他功能模块
