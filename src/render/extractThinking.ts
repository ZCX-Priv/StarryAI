interface ExtractResult {
  thinkingParts: string[];
  contentParts: string[];
  hasThinking: boolean;
}

export function extractThinkingBlocks(content: string): ExtractResult {
  const thinkRegex = /<think\/>([\s\S]*?)<\/think\/>/g;
  const thinkingParts: string[] = [];
  const contentParts: string[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = thinkRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      contentParts.push(content.slice(lastIndex, match.index));
    }
    thinkingParts.push(match[1].trim());
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) {
    contentParts.push(content.slice(lastIndex));
  }

  return { thinkingParts, contentParts, hasThinking: thinkingParts.length > 0 };
}
