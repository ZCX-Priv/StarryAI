const SystemPrompt = {
  buildSystemPrompt() {
    const templatePrompt = Prompts.buildSystemPromptFromTemplate();
    if (templatePrompt) {
      if (state.modePrompt) {
        return templatePrompt + '\n\n' + state.modePrompt;
      }
      return templatePrompt;
    }

    let p = `You are 星语, a thoughtful and adaptive AI assistant.\n\n`;
    p += `## Core behavior:\n`;
    p += `- Be genuinely helpful and direct. Adapt tone naturally.\n`;
    p += `- Do NOT forcibly reference memory in every response. Use it only when truly relevant.\n`;
    p += `- Memory is background context — it informs your style, not your topic choices.\n`;
    p += `- Never announce that you are using memory.\n\n`;
    if (state.memory.length) {
      p += `## Background context about this user:\n${state.memory.map(m=>`- ${m}`).join('\n')}\n\n`;
      p += `## How to apply this context:\n`;
      p += `- Use preferred name/tone naturally if known.\n`;
      p += `- If user asks about a topic overlapping their interests, acknowledge naturally — do not bring up interests unless the conversation opens that door.\n`;
      p += `- Adapt depth and style to what you know — but respond to what they ASKED.\n\n`;
    }
    
    if (state.modePrompt) {
      p += '\n\n' + state.modePrompt;
    }
    
    return p;
  },

  buildMemoryExtractPrompt(existingMemory, conversation) {
    if (!state.memoryExtractTemplate) {
      return `You are a memory manager for an AI assistant. Extract only truly new and durable personal facts about the USER.\n\nSTRICT RULES:\n1. Only facts about the USER — never AI responses.\n2. Only NEW facts NOT already in existing memory.\n3. If a topic already exists (e.g. "user likes anime"), do NOT add more about that same topic unless it is a completely different type of fact.\n4. Skip transient/task info. Only durable: name, language, tone, profession, core interests (one per topic), habits.\n5. Max 10 words per fact.\n6. If nothing new: return exactly []\n7. Return ONLY a valid JSON array of strings.\n\nExisting memory — do NOT duplicate these topics:\n${existingMemory}`;
    }

    return Prompts.parsePromptTemplate(state.memoryExtractTemplate, {
      existing_memory: existingMemory,
      conversation: JSON.stringify(conversation)
    });
  },

  buildMemoryDeduplicatePrompt(memoryList, maxEntries) {
    if (!state.memoryDeduplicateTemplate) {
      return `You are a memory optimizer. Clean and deduplicate a list of user facts.\n\nRULES:\n- Merge all facts about the same topic into ONE concise entry. Keep only the ESSENCE.\n- Remove redundant, overly specific, or repetitive entries.\n- Limit to ONE entry per topic/interest area.\n- Keep ONLY high-value durable facts: name, language preference, tone, profession, core interests (one per area), habits.\n- Max ${maxEntries} entries. Max 12 words each.\n- Return ONLY a valid JSON array of strings. Nothing else.`;
    }

    return Prompts.parsePromptTemplate(state.memoryDeduplicateTemplate, {
      memory_list: JSON.stringify(memoryList),
      max_entries: maxEntries
    });
  },

  buildMessages(msgs) {
    const sys = this.buildSystemPrompt();
    return sys ? [{role:'system', content:sys}, ...msgs] : msgs;
  }
};
