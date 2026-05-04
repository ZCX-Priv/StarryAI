/* ─── Prompts ─────────────────────────────────────────── */
const Prompts = {
  async loadMainPrompt() {
    try {
      const response = await fetch('prompts/main.md');
      if (!response.ok) {
        console.warn('Failed to load main.md, using fallback');
        return null;
      }
      const text = await response.text();
      state.mainPromptTemplate = text;
      return text;
    } catch (error) {
      console.warn('Error loading main.md:', error);
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

    const langName = Context.getLanguageName();
    const memHasLang = Context.hasLanguagePreference();

    let prompt = '';
    
    if (state.agentPrompt) {
      prompt += state.agentPrompt + '\n\n';
    }
    
    const identitySection = this.extractSection(state.mainPromptTemplate, '基本身份');
    if (identitySection) {
      prompt += identitySection + '\n\n';
    }
    
    const coreBehaviorSection = this.extractSection(state.mainPromptTemplate, '核心行为准则');
    if (coreBehaviorSection) {
      prompt += '## Core behavior:\n';
      prompt += coreBehaviorSection.replace(/^- /gm, '- ') + '\n\n';
    }
    
    if (state.memory.length) {
      prompt += `## Background context about this user:\n${state.memory.map(m=>`- ${m}`).join('\n')}\n\n`;
      prompt += `## How to apply this context:\n`;
      prompt += `- Use preferred name/tone naturally if known.\n`;
      prompt += `- If user asks about a topic overlapping their interests, acknowledge naturally — do not bring up interests unless the conversation opens that door.\n`;
      prompt += `- Adapt depth and style to what you know — but respond to what they ASKED.\n\n`;
    }
    
    prompt += memHasLang
      ? `## Language: Use the language recorded in context. Maintain it even if the user writes in another language.\n`
      : `## Language: Respond in ${langName} by default. Switch immediately if the user writes in a different language.\n`;
    
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
