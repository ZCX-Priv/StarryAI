const Tools = {
  parseToolTags(response) {
    const tools = [];
    
    const searchRegex = /<search>(.*?)<\/search>/gs;
    let match;
    while ((match = searchRegex.exec(response)) !== null) {
      tools.push({ type: 'search', query: match[1].trim(), original: match[0] });
    }
    
    const imageRegex = /<image\s+p="([^"]*)">(.*?)<\/image>/gs;
    while ((match = imageRegex.exec(response)) !== null) {
      tools.push({ type: 'image', params: match[1], prompt: match[2].trim(), original: match[0] });
    }
    
    const musicRegex = /<music\s+p="([^"]*)">(.*?)<\/music>/gs;
    while ((match = musicRegex.exec(response)) !== null) {
      tools.push({ type: 'music', params: match[1], prompt: match[2].trim(), original: match[0] });
    }
    
    const videoRegex = /<video\s+p="([^"]*)">(.*?)<\/video>/gs;
    while ((match = videoRegex.exec(response)) !== null) {
      tools.push({ type: 'video', params: match[1], prompt: match[2].trim(), original: match[0] });
    }
    
    return tools;
  },
  
  async executeTool(tool) {
    switch (tool.type) {
      case 'search':
        return await this.executeSearch(tool);
      case 'image':
        return await this.executeImageGeneration(tool);
      case 'music':
        return await this.executeMusicGeneration(tool);
      case 'video':
        return await this.executeVideoGeneration(tool);
      default:
        return null;
    }
  },
  
  async executeSearch(tool) {
    try {
      const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(tool.query)}&format=json&no_html=1`);
      const data = await response.json();
      
      if (data.AbstractText) {
        return {
          original: tool.original,
          replacement: `**搜索结果**: ${data.AbstractText}\n\n来源: ${data.AbstractURL || 'DuckDuckGo'}`
        };
      } else if (data.RelatedTopics && data.RelatedTopics.length > 0) {
        const results = data.RelatedTopics.slice(0, 3)
          .filter(t => t.Text)
          .map(t => `- ${t.Text}`)
          .join('\n');
        return {
          original: tool.original,
          replacement: `**搜索结果**:\n${results}`
        };
      }
      
      return {
        original: tool.original,
        replacement: `**搜索结果**: 未找到相关信息`
      };
    } catch (error) {
      return {
        original: tool.original,
        replacement: `**搜索失败**: ${error.message}`
      };
    }
  },
  
  async executeImageGeneration(tool) {
    const defaultParams = 'model=zimage&width=1024&height=1024';
    const userParams = tool.params ? tool.params.replace(/;/g, '&') : '';
    const params = userParams ? `${defaultParams}&${userParams}` : defaultParams;
    const url = `https://gen.pollinations.ai/image/${encodeURIComponent(tool.prompt)}?${params}&key=${state.activeKey}`;
    return {
      original: tool.original,
      replacement: `![生成的图片](${url})\n\n*图片已生成 (1024x1024, zimage模型)*`
    };
  },
  
  async executeMusicGeneration(tool) {
    const defaultParams = 'model=acestep';
    const userParams = tool.params ? tool.params.replace(/;/g, '&') : '';
    const params = userParams ? `${defaultParams}&${userParams}` : defaultParams;
    const url = `https://gen.pollinations.ai/audio/${encodeURIComponent(tool.prompt)}?${params}&key=${state.activeKey}`;
    return {
      original: tool.original,
      replacement: `🎵 [生成的音乐](${url})\n\n*音乐已生成 (acestep模型)*`
    };
  },
  
  async executeVideoGeneration(tool) {
    const defaultParams = 'model=ltx&duration=5';
    const userParams = tool.params ? tool.params.replace(/;/g, '&') : '';
    const params = userParams ? `${defaultParams}&${userParams}` : defaultParams;
    const url = `https://gen.pollinations.ai/video/${encodeURIComponent(tool.prompt)}?${params}&key=${state.activeKey}`;
    return {
      original: tool.original,
      replacement: `🎬 [生成的视频](${url})\n\n*视频已生成 (ltx模型, 5秒)*`
    };
  },
  
  replaceToolTags(response, toolResults) {
    let result = response;
    
    toolResults.forEach(({ original, replacement }) => {
      result = result.replace(original, replacement);
    });
    
    return result;
  }
};
