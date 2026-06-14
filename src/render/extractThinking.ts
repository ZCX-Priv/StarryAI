export interface ThinkingPart {
  content: string;
  isComplete: boolean;
}

interface ExtractResult {
  thinkingParts: ThinkingPart[];
  contentParts: string[];
  hasThinking: boolean;
}

export function extractThinkingBlocks(content: string): ExtractResult {
  const thinkingParts: ThinkingPart[] = [];
  const contentParts: string[] = [];
  let lastIndex = 0;
  const openTag = '<think>';
  const closeTag = '</think>';

  let i = 0;
  while (i < content.length) {
    const openIndex = content.indexOf(openTag, i);
    if (openIndex === -1) break;

    const closeIndex = content.indexOf(closeTag, openIndex);

    if (closeIndex === -1) {
      // 未闭合：流式渲染中
      if (openIndex > lastIndex) {
        contentParts.push(content.slice(lastIndex, openIndex));
      }
      thinkingParts.push({
        content: content.slice(openIndex + openTag.length).trim(),
        isComplete: false,
      });
      lastIndex = content.length;
      break;
    } else {
      // 正常闭合
      if (openIndex > lastIndex) {
        contentParts.push(content.slice(lastIndex, openIndex));
      }
      thinkingParts.push({
        content: content.slice(openIndex + openTag.length, closeIndex).trim(),
        isComplete: true,
      });
      lastIndex = closeIndex + closeTag.length;
      i = lastIndex;
    }
  }

  if (lastIndex < content.length) {
    contentParts.push(content.slice(lastIndex));
  }

  return { thinkingParts, contentParts, hasThinking: thinkingParts.length > 0 };
}
