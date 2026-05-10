const Context = {
  LANG_NAMES: Language.LANG_NAMES,
  
  hasLanguagePreference() {
    return Language.hasLanguagePreference();
  },
  
  getLanguageName() {
    return Language.getLanguageName();
  },
  
  Memory: MemoryManager,
  
  buildSystemPrompt() {
    return SystemPrompt.buildSystemPrompt();
  },
  
  buildMemoryExtractPrompt(existingMemory, conversation) {
    return SystemPrompt.buildMemoryExtractPrompt(existingMemory, conversation);
  },
  
  buildMemoryDeduplicatePrompt(memoryList, maxEntries) {
    return SystemPrompt.buildMemoryDeduplicatePrompt(memoryList, maxEntries);
  },
  
  buildMessages(msgs) {
    return SystemPrompt.buildMessages(msgs);
  }
};

const Memory = Context.Memory;
