let tavilyConfigPromise = null;

async function loadTavilyConfig() {
  if (!tavilyConfigPromise) {
    tavilyConfigPromise = fetch('config/tavily.json')
      .then(async response => {
        if (!response.ok) {
          throw new Error('未找到 Tavily 配置文件 config/tavily.json');
        }

        const config = await response.json();
        const apiKey = config.apiKey || config.api_key || config.key;

        if (!apiKey) {
          throw new Error('Tavily 配置缺少 apiKey');
        }

        return {
          apiKey,
          maxResults: Number(config.maxResults || config.max_results) || 3,
          searchDepth: config.searchDepth || config.search_depth || 'basic',
          includeAnswer: config.includeAnswer !== false
        };
      });
  }

  return tavilyConfigPromise;
}

async function executeSearch(tool) {
  try {
    const config = await loadTavilyConfig();
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_key: config.apiKey,
        query: tool.query,
        search_depth: config.searchDepth,
        max_results: config.maxResults,
        include_answer: config.includeAnswer
      })
    });

    if (!response.ok) {
      let message = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        message = errorData.detail || errorData.error || message;
      } catch {}
      throw new Error(message);
    }

    const data = await response.json();
    const answer = typeof data.answer === 'string' ? data.answer.trim() : '';
    const results = Array.isArray(data.results) ? data.results : [];

    if (answer) {
      return {
        original: tool.original,
        replacement: `**搜索结果**: ${answer}`
      };
    }

    if (results.length > 0) {
      const formattedResults = results
        .slice(0, config.maxResults)
        .map(item => {
          const title = item.title || '未命名结果';
          const content = (item.content || '').trim();
          const url = item.url || 'Tavily';
          return `- **${title}**: ${content || '无摘要'}\n  来源: ${url}`;
        })
        .join('\n');

      return {
        original: tool.original,
        replacement: `**搜索结果**:\n${formattedResults}`
      };
    }

    return {
      original: tool.original,
      replacement: '**搜索结果**: 未找到相关信息'
    };
  } catch (error) {
    return {
      original: tool.original,
      replacement: `**搜索失败**: ${error.message}`
    };
  }
}
