/**
 * app.js — Entry point.
 * Wires all modules together and orchestrates the send flow.
 */

import { state }                         from './state.js';
import { initTheme, toggleTheme }        from './theme.js';
import { initSettings, syncKeyInput, _syncModePill } from './settings.js';
import { initChat, addUserMessage, createAssistantMessage, setLoading, onSend } from './chat.js';
import { initSchema, getSchema, renderJsonResponse, clearJsonResponse } from './schema.js';
import { sendMessage as openaiSend }     from './providers/openai.js';
import { sendMessage as anthropicSend, CorsError } from './providers/anthropic.js';
import { sendMessage as geminiSend }     from './providers/gemini.js';

// ── Bootstrap ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initSettings();
  initChat();
  initSchema();

  _bindThemeToggle();
  _bindModeToggle();
  _bindProviderSideEffects();
  _bindCorsDismiss();

  onSend(_handleSend);

  // Sync mode pill after layout settles
  requestAnimationFrame(_syncModePill);
});

// ── Theme ─────────────────────────────────────────────────────
function _bindThemeToggle() {
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
}

// ── Mode Toggle ───────────────────────────────────────────────
function _bindModeToggle() {
  const chatView       = document.getElementById('chat-view');
  const structuredView = document.getElementById('structured-view');

  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      if (mode === state.mode) return;

      // Update state + button styles
      state.mode = mode;
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      _syncModePill();

      // Toggle views
      if (mode === 'chat') {
        chatView.removeAttribute('hidden');
        structuredView.setAttribute('hidden', '');
        clearJsonResponse();
      } else {
        chatView.setAttribute('hidden', '');
        structuredView.removeAttribute('hidden');
      }
    });
  });
}

// ── Provider Side-effects ─────────────────────────────────────
function _bindProviderSideEffects() {
  // Imported from settings.js via event; settings.js calls onProviderChange
  // We listen on document for the change instead of double-importing
  document.addEventListener('click', e => {
    const btn = e.target.closest('.provider-btn');
    if (!btn) return;
    _handleProviderChange(btn.dataset.provider);
  });
}

function _handleProviderChange(provider) {
  syncKeyInput();

  const banner = document.getElementById('cors-banner');
  if (provider === 'anthropic') {
    banner.removeAttribute('hidden');
  } else {
    banner.setAttribute('hidden', '');
  }
}

// ── CORS Banner Dismiss ───────────────────────────────────────
function _bindCorsDismiss() {
  document.getElementById('cors-dismiss').addEventListener('click', () => {
    document.getElementById('cors-banner').setAttribute('hidden', '');
  });
}

// ── Send Handler ──────────────────────────────────────────────
async function _handleSend(text) {
  const apiKey = state.apiKeys[state.provider];

  if (!apiKey?.trim()) {
    _showToast('Enter an API key in the sidebar first.');
    return;
  }

  const schema = state.mode === 'structured' ? getSchema() : null;

  if (state.mode === 'structured' && !schema) {
    _showToast('Fix the JSON schema before sending.');
    return;
  }

  // Add user message to UI + state
  addUserMessage(text);

  const msgHandle = createAssistantMessage();
  setLoading(true);

  if (state.mode === 'structured') {
    clearJsonResponse();
  }

  try {
    // state.messages already has the new user message appended by addUserMessage()
    const opts = {
      messages:     [...state.messages],
      model:        state.model,
      temperature:  state.temperature,
      maxTokens:    state.maxTokens,
      systemPrompt: state.systemPrompt,
      apiKey,
      schema,
    };

    const generator = _getGenerator(opts);
    let   fullText  = '';

    for await (const chunk of generator) {
      fullText += chunk;
      if (state.mode === 'chat') {
        msgHandle.append(chunk);
      }
    }

    msgHandle.finalize(fullText);

    if (state.mode === 'structured') {
      renderJsonResponse(fullText);
    }

  } catch (err) {
    console.error('[LLM Switchboard]', err);

    if (err instanceof CorsError) {
      msgHandle.showError(err.message);
    } else {
      msgHandle.showError(`Error: ${err.message}`);
    }
  } finally {
    setLoading(false);
  }
}

function _getGenerator(opts) {
  switch (state.provider) {
    case 'openai':    return openaiSend(opts);
    case 'anthropic': return anthropicSend(opts);
    case 'gemini':    return geminiSend(opts);
    default:          throw new Error(`Unknown provider: ${state.provider}`);
  }
}

// ── Toast ─────────────────────────────────────────────────────
function _showToast(msg) {
  let toast = document.getElementById('llm-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'llm-toast';
    toast.style.cssText = [
      'position:fixed', 'bottom:24px', 'left:50%', 'transform:translateX(-50%)',
      'background:var(--surface)', 'color:var(--text)', 'border:1px solid var(--border)',
      'padding:10px 18px', 'border-radius:var(--r-pill)', 'font-size:13px',
      'font-family:var(--font)', 'box-shadow:var(--shadow-md)',
      'z-index:9999', 'pointer-events:none',
      'opacity:0', 'transition:opacity 200ms',
    ].join(';');
    document.body.appendChild(toast);
  }

  toast.textContent = msg;
  toast.style.opacity = '1';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 3000);
}
