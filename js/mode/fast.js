const FastMode = {
  name: '快速',
  description: '适用于大部分情况',
  
  getParams() {
    return {
      reasoning_effort: "none",
      thinking: { type: "disabled" },
      temperature: 0.8,
      useTools: false
    };
  },
  
  getModel(defaultModel) {
    return defaultModel;
  }
};
