const Context = {
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
