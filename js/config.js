/* ─── 配置 ──────────────────────────────────────────── */
const API_BASE = 'https://gen.pollinations.ai';

const KEYS = {
  KEYS_MAP: {
    KEYS:        'pollen_keys',
    ACTIVE_KEY:  'pollen_active_key',
    CHATS:       'pollen_chats',
    ACTIVE_CHAT: 'pollen_active_chat',
    MEMORY:      'pollen_memory',
    THEME:       'pollen_theme',
    MODEL:       'pollen_model',
    TEMPERATURE: 'pollen_temperature',
    TOP_P:       'pollen_top_p',
    CONTEXT_LENGTH: 'pollen_context_length',
  }
};

const MEMORY_MAX_BLOCKS = 20;

const DEFAULT_MODELS = [
  { id: 'nova-fast',    label: 'Nova Fast'       },
  { id: 'openai-fast',  label: 'OpenAI Fast'     },
  { id: 'openai',       label: 'OpenAI GPT-4o'   },
  { id: 'openai-large', label: 'OpenAI Large'    },
  { id: 'claude-fast',  label: 'Claude Fast'     },
  { id: 'claude',       label: 'Claude Sonnet'   },
  { id: 'gemini-fast',  label: 'Gemini Fast'     },
  { id: 'gemini',       label: 'Gemini'          },
  { id: 'deepseek',     label: 'DeepSeek'        },
  { id: 'mistral',      label: 'Mistral'         },
  { id: 'llama',        label: 'Llama'           },
];

function formatContextLength(length) {
  if (!length) return null;
  if (length >= 1000000) {
    const m = length / 1000000;
    return (m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)) + 'M';
  }
  if (length >= 1000) {
    return Math.round(length / 1000) + 'K';
  }
  return length.toString();
}
