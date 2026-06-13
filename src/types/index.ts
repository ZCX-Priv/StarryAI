// 聊天相关
export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  rendered?: string;
  ts: number;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  model: string;
  agentId: string | null;
}

// 模型相关
export interface ModelInfo {
  id: string;
  label: string;
  pollen?: number | null;
  paidOnly?: boolean;
  reasoning?: boolean;
  contextLength?: number | null;
}

// 智能体相关
export interface AgentItem {
  id: string;
  name: string;
  avatar: string;
  description: string;
  category: string;
  promptFile: string;
}

export interface AgentCategory {
  id: string;
  name: string;
  icon: string;
}

export interface AgentsConfig {
  categories: AgentCategory[];
  agents: AgentItem[];
}

// Banner 相关
export interface BannerAction {
  id: string;
  name: string;
  icon: string;
  iconSvg: string;
  prompt: string;
  mode?: string;
}

// 模式相关
export type ModeType = 'fast' | 'thinking' | 'expert';

export interface ModeConfig {
  reasoning_effort?: string;
  thinking?: { type: string };
  temperature?: number;
  model?: string;
  useTools?: boolean;
}

// UI 相关
export type PageType = 'chat' | 'agents' | 'settings';
export type SettingsTab = 'appearance' | 'model' | 'keys' | 'memory' | 'about';
