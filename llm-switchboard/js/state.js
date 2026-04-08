/**
 * state.js — Shared application state singleton
 * All modules read/write this object directly.
 */

export const state = {
  provider: 'openai',

  apiKeys: {
    openai:    '',
    anthropic: '',
    gemini:    '',
  },

  modelsByProvider: {
    openai: [
      { id: 'gpt-4o',           label: 'GPT-4o' },
      { id: 'gpt-4o-mini',      label: 'GPT-4o mini' },
      { id: 'gpt-4-turbo',      label: 'GPT-4 Turbo' },
      { id: 'gpt-3.5-turbo',    label: 'GPT-3.5 Turbo' },
    ],
    anthropic: [
      { id: 'claude-opus-4-6',           label: 'Claude Opus 4.6' },
      { id: 'claude-sonnet-4-6',         label: 'Claude Sonnet 4.6' },
      { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
    ],
    gemini: [
      { id: 'gemini-2.0-flash',   label: 'Gemini 2.0 Flash' },
      { id: 'gemini-1.5-pro',     label: 'Gemini 1.5 Pro' },
      { id: 'gemini-1.5-flash',   label: 'Gemini 1.5 Flash' },
    ],
  },

  model:        'gpt-4o',
  temperature:  0.7,
  maxTokens:    2048,
  systemPrompt: '',

  /** @type {Array<{role: 'user'|'assistant', content: string}>} */
  messages: [],

  /** @type {'chat'|'structured'} */
  mode: 'chat',

  isLoading: false,
};
