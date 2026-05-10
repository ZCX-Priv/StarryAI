async function executeVideoGeneration(tool) {
  const defaultParams = 'model=ltx&duration=5';
  const userParams = tool.params ? tool.params.replace(/;/g, '&') : '';
  const params = userParams ? `${defaultParams}&${userParams}` : defaultParams;
  const url = `https://gen.pollinations.ai/video/${encodeURIComponent(tool.prompt)}?${params}&key=${state.activeKey}`;
  return {
    original: tool.original,
    replacement: `🎬 [生成的视频](${url})\n\n*视频已生成 (ltx模型, 5秒)*`
  };
}
