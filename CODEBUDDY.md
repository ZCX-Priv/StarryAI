# CODEBUDDY.md

This file provides guidance to CodeBuddy Code when working with code in this repository.

## Project Overview

**星语 (AIChat)** — a Chinese-language AI chat application built with React 19 + Vite 8, using Zustand for state management and IndexedDB for local persistence. The backend API is Pollinations AI (`https://gen.pollinations.ai`). The UI is in Chinese; prompt files and data files are also in Chinese.

## Commands

- **Dev server:** `npm run dev` (Vite HMR on localhost:5173)
- **Build:** `npm run build` (outputs to `dist/`)
- **Preview build:** `npm run preview`
- **Lint:** `npm run lint` (ESLint flat config, ignores `dist/`)
- No test framework is configured — there are no test commands.

## Architecture

### State Management — Single Flat Zustand Store

All app state lives in one store (`src/store/useAppStore.js`) with ~40 fields. There are no slices or middleware. Persistence to IndexedDB is done manually in each hook/action, not via zustand middleware. Store actions are simple setters plus a few compound operations (`createChat`, `switchToChat`, `deleteChat`, `addMessage`, `renameChat`, `addMemoryItems`, `showToast`).

### Initialization Flow (`src/hooks/useStore.js`)

The app boots in a specific order — must complete before `AppShell` renders:
1. Init IndexedDB (`IDBStore.init()`)
2. Run localStorage → IndexedDB migration (`Migration.run()`)
3. Parallel load all persisted data (chats, keys, memory, config values)
4. Load prompt templates (Vite `?raw` imports for soul.md, mode prompts, memory templates)
5. Fetch `agents.json` and `banner.json`, merge with custom agents from IndexedDB
6. Call `API.loadModels()` to update available models from the API
7. Set `initialized = true`

### Streaming Architecture

- `API.stream()` (`src/services/api.js`) is an **async generator** that yields SSE chunk text
- Streaming text accumulates in `store.streamingText` during generation
- On completion, the full response is saved via `addMessage('assistant', fullResp)` and `streamingText` is cleared
- Stop is checked each iteration via `stopRequested` state flag
- If streaming fails, falls back to non-streaming `API.fetch()`

### Reasoning/Thinking Content Normalization

The API layer normalizes various reasoning formats (`reasoning_content`, `reasoning`, `reasoning_details`) into custom `<think/>...</think/>` tags. `extractThinking.js` then splits these out for separate rendering in `ThinkingBlock` (collapsible) vs `MarkdownRenderer` (main content). Do not change the `<think/>` tag format — it was chosen to avoid HTML parser conflicts.

### Prompt System — Layered Composition

System prompts are built by `buildSystemPromptFromTemplate()` (`src/lib/prompts.js`) through concatenation:

```
soul.md (global behavior rules)
  + mode prompt (fast.md / thinking.md / expert.md)
  + agent prompt (assistant.md / coder.md / writer.md, or custom)
  + banner prompt (image / coding / solve / translate / research / analysis)
  + memory section (up to 20 user facts)
  + time section (gregorian + lunar calendar, festivals, solar terms)
```

- `soul.md`, mode prompts, and memory templates: **compile-time** via Vite `?raw` imports
- Agent and banner prompts: **runtime fetch** — changes to these don't require rebuild

### Three Chat Modes

Defined in `modeConfig` in the store, each mode injects different API parameters:
- **fast:** `reasoning_effort: "none"`, `thinking: {type: "disabled"}`, temp 0.8
- **thinking:** `reasoning_effort: "high"`, `thinking: {type: "enabled"}`, temp 0.7
- **expert:** `reasoning_effort: "xhigh"`, `thinking: {type: "enabled"}`, uses `perplexity-reasoning` model, enables tools (`<search>`, `<image>`, `<music>`, `<video>` tags)

### Memory System (`src/context/memory.js`)

Auto-triggered after each conversation (last 6 messages):
1. **Extract:** calls `nova-fast` model at temp 0.3 → returns short factual strings (≤10 chars each)
2. **Deduplicate:** triggered when memory ≥ 5 items, calls `nova-fast` at temp 0.2, merges similar items, caps at 20 items (≤12 chars each)

### Persistence — IndexedDB (`src/services/storage.js`)

Database `AIChatDB` v1 with 5 object stores: `config` (key-value), `chats` (full chat objects), `memory` (single record), `keys` (key list + active key), `agents` (custom agents config). All persistence calls are in the hooks, not in store actions.

### Routing — No Router Library

Page switching is via `store.currentPage` state (`'chat'` or `'agents'`), not React Router. Sidebar and modal navigation are state-driven.

### Path Alias

`@` → `./src` (configured in `vite.config.js`). Use `@/hooks/useChat`, `@/store/useAppStore`, etc.

## Key File Map

| Area | Files |
|------|-------|
| Store | `src/store/useAppStore.js` |
| Init | `src/hooks/useStore.js` |
| Chat logic | `src/hooks/useChat.js` |
| Streaming | `src/hooks/useStream.js`, `src/services/api.js` |
| Prompts | `src/lib/prompts.js`, `src/prompts/soul.md`, `src/prompts/mode/*.md`, `src/prompts/agents/*.md`, `src/prompts/banner/*.md` |
| Memory | `src/context/memory.js`, `src/hooks/useMemory.js` |
| Storage | `src/services/storage.js` (IDB), `src/services/migration.js` (localStorage→IDB) |
| Data configs | `src/data/agents.json`, `src/data/banner.json`, `src/data/models.json` |
| Layout | `src/components/layout/AppShell.jsx`, `src/components/layout/Sidebar.jsx`, `src/components/layout/Topbar.jsx` |
| Chat UI | `src/components/chat/ChatArea.jsx`, `src/components/chat/InputArea.jsx`, `src/components/chat/MessageList.jsx` |
| Rendering | `src/render/MarkdownRenderer.jsx`, `src/render/ThinkingBlock.jsx`, `src/render/extractThinking.js` |
| Agents UI | `src/components/agents/AgentsPage.jsx` |

## Conventions

- **Language:** UI text, prompts, and data files are in Chinese. Code comments are sparse.
- **JSX, not TSX:** The project uses plain JSX (`*.jsx` files) with no TypeScript.
- **ES module:** `"type": "module"` in package.json — all source uses ESM imports.
- **shadcn config:** Present (`components.json`) with `tsx: false`, zinc base color, CSS variables. UI component path is `@/components/ui`.
- **No tests:** No test runner or test files exist in this project.
- **`原版/` directory:** Contains reference/original skill files, gitignored — not part of the build.