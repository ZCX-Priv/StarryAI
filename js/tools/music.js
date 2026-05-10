async function executeMusicGeneration(tool) {
  const defaultParams = 'model=acestep';
  const userParams = tool.params ? tool.params.replace(/;/g, '&') : '';
  const params = userParams ? `${defaultParams}&${userParams}` : defaultParams;
  const url = `https://gen.pollinations.ai/audio/${encodeURIComponent(tool.prompt)}?${params}&key=${state.activeKey}`;
  return {
    original: tool.original,
    replacement: `🎵 [生成的音乐](${url})\n\n*音乐已生成 (acestep模型)*`
  };
}
