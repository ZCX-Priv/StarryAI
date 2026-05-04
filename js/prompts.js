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

    const langNames = {
      pt:'Portuguese (Brazilian)', en:'English', es:'Spanish', fr:'French',
      de:'German', it:'Italian', ja:'Japanese', zh:'Chinese (Simplified)', ko:'Korean', ru:'Russian'
    };
    const langName = langNames[state.lang] || 'English';
    const memHasLang = state.memory.some(m =>
      /\b(language|idioma|l[íi]ngua|sprache|langue|lingua|言語|语言|언어|язык|prefer.*speak|speak.*prefer|fala|gosta.*escrever)\b/i.test(m)
    );

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

  buildMemoryExtractPrompt(existingMemory, conversation) {
    if (!state.memoryExtractTemplate) {
      return `You are a memory manager for an AI assistant. Extract only truly new and durable personal facts about the USER.\n\nSTRICT RULES:\n1. Only facts about the USER — never AI responses.\n2. Only NEW facts NOT already in existing memory.\n3. If a topic already exists (e.g. "user likes anime"), do NOT add more about that same topic unless it is a completely different type of fact.\n4. Skip transient/task info. Only durable: name, language, tone, profession, core interests (one per topic), habits.\n5. Max 10 words per fact.\n6. If nothing new: return exactly []\n7. Return ONLY a valid JSON array of strings.\n\nExisting memory — do NOT duplicate these topics:\n${existingMemory}`;
    }
    
    return this.parsePromptTemplate(state.memoryExtractTemplate, {
      existing_memory: existingMemory,
      conversation: JSON.stringify(conversation)
    });
  },

  buildMemoryDeduplicatePrompt(memoryList, maxEntries) {
    if (!state.memoryDeduplicateTemplate) {
      return `You are a memory optimizer. Clean and deduplicate a list of user facts.\n\nRULES:\n- Merge all facts about the same topic into ONE concise entry. Keep only the ESSENCE.\n- Remove redundant, overly specific, or repetitive entries.\n- Limit to ONE entry per topic/interest area.\n- Keep ONLY high-value durable facts: name, language preference, tone, profession, core interests (one per area), habits.\n- Max ${maxEntries} entries. Max 12 words each.\n- Return ONLY a valid JSON array of strings. Nothing else.`;
    }
    
    return this.parsePromptTemplate(state.memoryDeduplicateTemplate, {
      memory_list: JSON.stringify(memoryList),
      max_entries: maxEntries
    });
  }
};
