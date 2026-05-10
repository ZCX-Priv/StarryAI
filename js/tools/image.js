async function executeImageGeneration(tool) {
  const defaultParams = 'model=zimage&width=1024&height=1024';
  const userParams = tool.params ? tool.params.replace(/;/g, '&') : '';
  const params = userParams ? `${defaultParams}&${userParams}` : defaultParams;
  const url = `https://gen.pollinations.ai/image/${encodeURIComponent(tool.prompt)}?${params}&key=${state.activeKey}`;
  return {
    original: tool.original,
    replacement: `![生成的图片](${url})\n\n*图片已生成 (1024x1024, zimage模型)*`
  };
}
