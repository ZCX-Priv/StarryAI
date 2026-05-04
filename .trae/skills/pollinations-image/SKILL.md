---
name: "pollinations-image"
description: "Generate images using Pollinations AI API. Invoke when user asks to create/generate images, pictures, or artwork from text descriptions."
---

# Pollinations Image Generator

This skill generates images using the Pollinations AI API and saves them to a specified location.

## When to Use

Invoke this skill when:
- User asks to generate/create an image from a text description
- User wants to create artwork, illustrations, or pictures
- User needs AI-generated visual content

## API Information

**Base URL:** `https://gen.pollinations.ai` (already configured in `js/config.js`)

**Endpoint:** `GET /image/{prompt}`

**Authentication:** Uses existing `state.activeKey` from localStorage

## Available Models

| Model | Description |
|-------|-------------|
| `flux` | High quality, fast generation |
| `zimage` | Default model, balanced quality |
| `gptimage` | GPT-based image generation |
| `gptimage-large` | Larger GPT image model |
| `gpt-image-2` | GPT Image 2 model |
| `kontext` | Context-aware generation |
| `seedream` | Dreamy artistic style |
| `seedream-pro` | Professional seedream |
| `nanobanana` | Fast lightweight model |
| `nanobanana-pro` | Professional lightweight |
| `klein` | Compact efficient model |
| `qwen-image` | Qwen image model |
| `grok-imagine` | Grok imagination model |
| `nova-canvas` | Nova canvas model |

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `prompt` | string | required | Text description of the image to generate |
| `model` | string | `zimage` | Model to use for generation |
| `width` | integer | 1024 | Image width in pixels |
| `height` | integer | 1024 | Image height in pixels |
| `seed` | integer | 0 | Seed for reproducible results (-1 for random) |
| `enhance` | boolean | true | Let AI improve prompt for better results |
| `negative_prompt` | string | "worst quality, blurry" | What to avoid in the image |
| `safe` | boolean | false | Enable safety content filters |
| `quality` | string | "high" | Quality level: low, medium, high, hd |
| `transparent` | boolean | false | Generate with transparent background |

## Implementation for This Project

Add the following code to `js/api.js` or create a new `js/image-api.js` file:

```javascript
const ImageAPI = {
  async generate(options) {
    const {
      prompt,
      model = 'zimage',
      width = 1024,
      height = 1024,
      seed = -1,
      enhance = true,
      negative_prompt = 'worst quality, blurry',
      safe = false,
      quality = 'high',
      transparent = false
    } = options;

    if (!state.activeKey) {
      throw new Error('请先添加API密钥');
    }

    const params = new URLSearchParams({
      model,
      width: width.toString(),
      height: height.toString(),
      seed: seed.toString(),
      enhance: enhance.toString(),
      negative_prompt,
      safe: safe.toString(),
      quality,
      transparent: transparent.toString()
    });

    const encodedPrompt = encodeURIComponent(prompt);
    const url = `${API_BASE}/image/${encodedPrompt}?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${state.activeKey}`
      }
    });

    if (response.status === 401) {
      throw new Error('认证失败，请检查API密钥');
    }
    if (response.status === 402) {
      throw new Error('花粉余额不足');
    }
    if (response.status === 403) {
      throw new Error('没有访问权限');
    }
    if (!response.ok) {
      throw new Error(`生成失败: HTTP ${response.status}`);
    }

    const blob = await response.blob();
    return blob;
  },

  async generateAndDownload(options, filename = 'generated-image.png') {
    const blob = await this.generate(options);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return filename;
  },

  async generateAndDisplay(options, imgElement) {
    const blob = await this.generate(options);
    const url = URL.createObjectURL(blob);
    imgElement.src = url;
    return url;
  },

  generateUrl(options) {
    const {
      prompt,
      model = 'zimage',
      width = 1024,
      height = 1024,
      seed = -1,
      enhance = true,
      safe = false,
      quality = 'high'
    } = options;

    const params = new URLSearchParams({
      model,
      width: width.toString(),
      height: height.toString(),
      seed: seed.toString(),
      enhance: enhance.toString(),
      safe: safe.toString(),
      quality
    });

    const encodedPrompt = encodeURIComponent(prompt);
    return `${API_BASE}/image/${encodedPrompt}?${params.toString()}`;
  }
};
```

## Usage Examples

### Generate and Download Image

```javascript
await ImageAPI.generateAndDownload({
  prompt: '一只在太空中漂浮的猫'
}, 'space-cat.png');
```

### Generate and Display in Chat

```javascript
const img = document.createElement('img');
img.style.maxWidth = '100%';
img.style.borderRadius = '8px';
await ImageAPI.generateAndDisplay({
  prompt: '美丽的日落风景'
}, img);
chatContainer.appendChild(img);
```

### Get Image URL (for preview)

```javascript
const url = ImageAPI.generateUrl({
  prompt: 'a beautiful sunset over mountains'
});
```

## Integration with Chat

To integrate image generation into the chat interface, add a command handler:

```javascript
const ImageCommands = {
  patterns: [
    /^\/image\s+(.+)$/i,
    /^生成图片[：:]\s*(.+)$/i,
    /^画[一张]?(.+)$/i
  ],
  
  async handle(input) {
    for (const pattern of this.patterns) {
      const match = input.match(pattern);
      if (match) {
        const prompt = match[1].trim();
        return await this.generateImage(prompt);
      }
    }
    return null;
  },
  
  async generateImage(prompt) {
    try {
      UI.showToast('正在生成图片...');
      const blob = await ImageAPI.generate({
        prompt
      });
      const url = URL.createObjectURL(blob);
      return {
        type: 'image',
        url,
        prompt
      };
    } catch (error) {
      UI.showToast(`生成失败: ${error.message}`);
      return null;
    }
  }
};
```

## Error Handling

| Status Code | Meaning | User Message |
|-------------|---------|--------------|
| 400 | Bad Request | 请求参数无效 |
| 401 | Unauthorized | 请检查API密钥 |
| 402 | Payment Required | 花粉余额不足 |
| 403 | Forbidden | 没有访问权限 |
| 429 | Rate Limited | 请求过于频繁，请稍后再试 |
| 500 | Server Error | 服务器错误，请稍后再试 |

## Notes

1. API密钥通过设置页面添加，存储在localStorage中
2. 密钥格式：`pk_` (可发布密钥) 或 `sk_` (密钥密钥)
3. 获取密钥：访问 [enter.pollinations.ai](https://enter.pollinations.ai)
4. 使用 `seed` 参数可复现相同结果
5. `enhance` 选项可自动优化提示词
6. 生成的图片格式为 JPEG 或 PNG
7. 默认设置：zimage模型、1024x1024尺寸、高质量、增强模式、无审查、无水印
