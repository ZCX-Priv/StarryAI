---
name: "pollinations-image"
description: "Generate images using Pollinations AI API. Invoke when user asks to create/generate images, pictures, or artwork from text descriptions."
---

# Pollinations Image Generator

Generate images using Pollinations AI API and save them to a specified location.

## When to Use

Invoke this skill when:
- User asks to generate/create an image from a text description
- User wants to create artwork, illustrations, or pictures
- User needs AI-generated visual content

## CRITICAL: Pre-Flight Checklist

**Before generating any image, you MUST check these conditions in order:**

### Step 1: Check API Key

**IMPORTANT: You must ask the user for their API key BEFORE attempting to generate images.**

Ask the user: "请提供您的Pollinations API密钥（格式：pk_ 或 sk_ 开头）。您可以在 [enter.pollinations.ai](https://enter.pollinations.ai) 获取密钥。"

Wait for the user to provide the key before proceeding.

### Step 2: Confirm Parameters

Confirm with the user:
- Prompt (required): What image to generate
- Output path (required): Where to save the image
- Model: Default is `zimage`
- Size: Default is `1024x1024`

### Step 3: Generate Image

Use curl command to download the image. **DO NOT retry on failure - report error and stop.**

## Default Settings

| Parameter | Default Value |
|-----------|---------------|
| `model` | `zimage` |
| `width` | `1024` |
| `height` | `1024` |
| `enhance` | `true` |
| `safe` | `false` (no censorship) |
| `quality` | `high` |
| `seed` | `-1` (random) |

## How to Generate Images

### Method: Use curl Command

**Always use curl to download images. This is the most reliable method.**

```bash
curl -o "<output_path>" "https://gen.pollinations.ai/image/<encoded_prompt>?model=zimage&width=1024&height=1024&enhance=true&safe=false&quality=high&seed=-1" -H "Authorization: Bearer <API_KEY>"
```

### Example curl Command

For prompt "a beautiful sunset over mountains" saving to "sunset.png":

```bash
curl -o "sunset.png" "https://gen.pollinations.ai/image/a%20beautiful%20sunset%20over%20mountains?model=zimage&width=1024&height=1024&enhance=true&safe=false&quality=high&seed=-1" -H "Authorization: Bearer YOUR_API_KEY"
```

## Step-by-Step Execution Guide

### Step 1: Ask for API Key (if not provided)

```
请提供您的Pollinations API密钥以生成图片。密钥格式为 pk_ 或 sk_ 开头。
获取密钥：https://enter.pollinations.ai
```

**DO NOT proceed without the API key.**

### Step 2: Construct the curl Command

Replace placeholders:
- `<API_KEY>`: User's API key
- `<prompt>`: URL-encoded prompt text
- `<output_path>`: Full path to save the image

### Step 3: Execute curl Command

Use RunCommand tool with:
- `command`: The curl command
- `blocking`: true
- `requires_approval`: false

### Step 4: Check Result

**On Success:**
- Tell user: "图片已生成并保存到: <output_path>"
- Show the image path
- STOP - do not make additional requests

**On Failure:**
- Report the exact error message
- DO NOT retry automatically
- DO NOT loop
- Ask user if they want to try again with different parameters

## Error Handling - IMPORTANT

**When an error occurs:**
1. Report the error message to the user
2. STOP immediately
3. DO NOT retry without user confirmation
4. DO NOT enter any loop

| HTTP Status | Meaning | Action |
|-------------|---------|--------|
| 400 | Bad Request | Check prompt encoding, report to user |
| 401 | Invalid API Key | Ask user to verify their key |
| 402 | Insufficient Balance | Tell user to add pollen |
| 403 | Forbidden | Check API key permissions |
| 429 | Rate Limited | Wait and ask user to retry later |
| 500 | Server Error | Report to user, suggest retrying later |

## Available Models

| Model | Description |
|-------|-------------|
| `zimage` | **DEFAULT** - Balanced quality |
| `flux` | High quality, fast generation |
| `gptimage` | GPT-based image generation |
| `gptimage-large` | Larger GPT image model |
| `gpt-image-2` | GPT Image 2 model |
| `kontext` | Context-aware generation |
| `seedream` | Dreamy artistic style |
| `nanobanana` | Fast lightweight model |
| `klein` | Compact efficient model |

## Complete Example

**User request:** "生成一张猫在太空的图片"

**Your response:**

1. First, ask for API key if not already provided:
   "请提供您的Pollinations API密钥（pk_ 或 sk_ 开头）"

2. After receiving key, ask for save location:
   "请告诉我图片保存的路径，例如: C:\Users\xxx\Desktop\space-cat.png"

3. Execute the command:
   ```bash
   curl -o "C:\Users\xxx\Desktop\space-cat.png" "https://gen.pollinations.ai/image/a%20cat%20in%20space?model=zimage&width=1024&height=1024&enhance=true&safe=false&quality=high&seed=-1" -H "Authorization: Bearer pk_xxx"
   ```

4. Report result:
   - Success: "图片已生成: C:\Users\xxx\Desktop\space-cat.png"
   - Failure: "生成失败: [error message]"

## Quick Reference

```
API Base URL: https://gen.pollinations.ai
Endpoint: GET /image/{prompt}
Auth: Bearer token in Authorization header
Default Model: zimage
Default Size: 1024x1024
Enhance: true (auto-improve prompt)
Safe: false (no censorship)
Quality: high
```

## Notes

1. Always ask for API key first - NEVER assume it exists
2. Use curl command - it's the most reliable method
3. Default to zimage model
4. On failure: report error and STOP - no automatic retries
5. No watermark on generated images
6. Images are JPEG or PNG format
