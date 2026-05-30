/* ─── 提示词 ─────────────────────────────────────────── */
const Prompts = {
  async loadMainPrompt() {
    try {
      const response = await fetch('prompts/soul.md');
      if (!response.ok) {
        console.warn('Failed to load soul.md, using fallback');
        return null;
      }
      const text = await response.text();
      state.mainPromptTemplate = text;
      return text;
    } catch (error) {
      console.warn('Error loading soul.md:', error);
      return null;
    }
  },

  async loadMemoryPrompts() {
    try {
      const [extractResponse, deduplicateResponse] = await Promise.all([
        fetch('prompts/memory-extract.md'),
        fetch('prompts/memory-deduplicate.md')
      ]);
      
      if (extractResponse.ok) {
        state.memoryExtractTemplate = await extractResponse.text();
      }
      
      if (deduplicateResponse.ok) {
        state.memoryDeduplicateTemplate = await deduplicateResponse.text();
      }
      
      return true;
    } catch (error) {
      console.warn('Error loading memory prompts:', error);
      return false;
    }
  },

  parsePromptTemplate(template, variables) {
    if (!template) return null;
    
    let result = template;
    
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{${key}}`;
      result = result.replace(new RegExp(placeholder, 'g'), value);
    }
    
    return result;
  },

  extractSection(template, sectionTitle) {
    if (!template) return null;
    
    const regex = new RegExp(`## ${sectionTitle}\\n([\\s\\S]*?)(?=\\n## |$)`, 'i');
    const match = template.match(regex);
    
    return match ? match[1].trim() : null;
  },

  buildSystemPromptFromTemplate() {
    if (!state.mainPromptTemplate) {
      return null;
    }

    let prompt = '';
    
    if (state.mainPromptTemplate) {
      prompt += state.mainPromptTemplate + '\n\n';
    }
    
    if (state.modePrompt) {
      prompt += state.modePrompt + '\n\n';
    }
    
    if (state.agentPrompt) {
      prompt += state.agentPrompt + '\n\n';
    }
    
    if (state.bannerPrompt) {
      prompt += state.bannerPrompt + '\n\n';
    }
    
    if (state.memory.length) {
      prompt += `## 关于用户的背景信息:\n${state.memory.map(m=>`- ${m}`).join('\n')}\n\n`;
      prompt += `## 如何应用这些信息:\n`;
      prompt += `- 如果知道用户偏好的称呼或语气，自然地使用。\n`;
      prompt += `- 如果用户询问的话题与其兴趣相关，自然地回应——除非对话涉及到，否则不要主动提起兴趣话题。\n`;
      prompt += `- 根据你了解的信息调整深度和风格——但要回应用户实际询问的内容。\n\n`;
    }
    
    const timeInfo = Time.getCurrentTimeInfo();
    if (timeInfo) {
      prompt += timeInfo + '\n';
    }
    
    return prompt;
  },

  async loadModePrompt(mode) {
    try {
      const response = await fetch(`prompts/mode/${mode}.md`);
      if (!response.ok) {
        console.warn(`Failed to load ${mode}.md`);
        return null;
      }
      const text = await response.text();
      state.modePrompt = text;
      return text;
    } catch (error) {
      console.warn(`Error loading ${mode}.md:`, error);
      return null;
    }
  }
};
