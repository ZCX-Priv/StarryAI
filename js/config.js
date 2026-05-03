/* ── Config ──────────────────────────────────────────── */
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
