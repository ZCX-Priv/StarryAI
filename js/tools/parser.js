function parseToolTags(response) {
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
}

function replaceToolTags(response, toolResults) {
  let result = response;
  
  toolResults.forEach(({ original, replacement }) => {
    result = result.replace(original, replacement);
  });
  
  return result;
}
