const ExpertMode = {
  name: '专家',
  description: '研究级智能模型',
  
  getParams() {
    return {
      reasoning_effort: "xhigh",
      thinking: { 
        type: "enabled"
      },
      temperature: 0.6,
      useTools: true
    };
  },
  
  getModel(defaultModel) {
    return "perplexity-reasoning";
  }
};
