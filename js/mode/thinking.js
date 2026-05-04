const ThinkingMode = {
  name: '思考',
  description: '擅长解决更难的问题',
  
  getParams() {
    return {
      reasoning_effort: "high",
      thinking: { 
        type: "enabled"
      },
      temperature: 0.7,
      useTools: false
    };
  },
  
  getModel(defaultModel) {
    return defaultModel;
  }
};
