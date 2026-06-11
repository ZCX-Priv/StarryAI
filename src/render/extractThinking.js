export function extractThinkingBlocks(content) {
  const thinkRegex = /<think\/>([\s\S]*?)<\/think\/>/g;
  const thinkingParts = [];
  const contentParts = [];
  let lastIndex = 0;
  let match;

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
