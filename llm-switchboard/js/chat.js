/**
 * chat.js — Message rendering, conversation history, streaming UI
 */

import { state } from './state.js';

// ── DOM refs (resolved after DOMContentLoaded) ────────────────
let messagesEl     = null;
let welcomeScreen  = null;
let structuredMsgs = null;

export function initChat() {
  messagesEl     = document.getElementById('messages');
  welcomeScreen  = document.getElementById('welcome-screen');
  structuredMsgs = document.getElementById('structured-messages');
  _bindInputResize();
  _bindInputEvents();
  document.addEventListener('llm:clear', clearMessages);
}

// ── Add message to state + DOM ────────────────────────────────
export function addUserMessage(content) {
  state.messages.push({ role: 'user', content });
  _hideWelcome();
  _renderMessage('user', content);
  _updateMsgCount();
}

/** Creates an empty assistant bubble and returns fns to stream into it. */
export function createAssistantMessage() {
  _hideWelcome();

  const container = state.mode === 'chat' ? messagesEl : structuredMsgs;

  const msg = _buildBubble('assistant', '');
  msg.element.querySelector('.msg-bubble').classList.add('typing-cursor');
  container.appendChild(msg.element);
  _scrollToBottom(container);

  return {
    append(text) {
      msg.contentSpan.textContent += text;
      _scrollToBottom(container);
    },
    finalize(fullText) {
      msg.element.querySelector('.msg-bubble').classList.remove('typing-cursor');
      msg.contentSpan.textContent = fullText;
      state.messages.push({ role: 'assistant', content: fullText });
      _updateMsgCount();
      _scrollToBottom(container);
    },
    showError(errText) {
      msg.element.classList.add('error');
      msg.element.querySelector('.msg-bubble').classList.remove('typing-cursor');
      msg.contentSpan.textContent = errText;
    },
  };
}

function _renderMessage(role, content) {
  const container = state.mode === 'chat' ? messagesEl : structuredMsgs;
  const msg = _buildBubble(role, content);
  container.appendChild(msg.element);
  _scrollToBottom(container);
}

function _buildBubble(role, content) {
  const providerClass = role === 'assistant' ? `provider-${state.provider}` : '';
  const avatarText    = role === 'user' ? 'U' : _providerInitial(state.provider);
  const timeStr       = _timeNow();

  const el = document.createElement('div');
  el.className = `message ${role} ${providerClass}`;
  el.innerHTML = `
    <div class="msg-avatar">${avatarText}</div>
    <div class="msg-body">
      <div class="msg-bubble"><span class="msg-content"></span></div>
      <div class="msg-meta">
        <span class="msg-time">${timeStr}</span>
        ${role === 'assistant' ? `<span class="msg-provider-badge provider-badge-${state.provider}">${_providerLabel(state.provider)}</span>` : ''}
      </div>
    </div>
  `;

  const contentSpan = el.querySelector('.msg-content');
  contentSpan.textContent = content;

  return { element: el, contentSpan };
}

function _providerInitial(p) {
  return { openai: 'AI', anthropic: 'C', gemini: 'G' }[p] || 'AI';
}

function _providerLabel(p) {
  return { openai: 'OpenAI', anthropic: 'Anthropic', gemini: 'Gemini' }[p] || p;
}

function _timeNow() {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date());
}

// ── Clear ─────────────────────────────────────────────────────
export function clearMessages() {
  state.messages = [];
  // Reset chat area
  messagesEl.innerHTML = '';
  if (welcomeScreen) messagesEl.appendChild(welcomeScreen);
  welcomeScreen?.removeAttribute('hidden');
  // Reset structured messages
  if (structuredMsgs) {
    structuredMsgs.innerHTML = `
      <div class="panel-empty-state">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="1.5"/>
          <polyline points="14 2 14 8 20 8" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
          <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <p>JSON responses will appear here</p>
      </div>
    `;
  }
  _updateMsgCount();
}

function _hideWelcome() {
  welcomeScreen?.setAttribute('hidden', '');
}

// ── Input handling ────────────────────────────────────────────
let _onSend = () => {};
export function onSend(fn) { _onSend = fn; }

function _bindInputResize() {
  const ta = document.getElementById('prompt-input');
  ta.addEventListener('input', () => {
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 180) + 'px';
    _updateCharCount(ta.value.length);
    _updateSendBtn(ta.value.trim().length > 0);
  });
}

function _bindInputEvents() {
  const ta      = document.getElementById('prompt-input');
  const sendBtn = document.getElementById('send-btn');

  sendBtn.addEventListener('click', _submit);

  ta.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      _submit();
    }
  });
}

function _submit() {
  const ta  = document.getElementById('prompt-input');
  const val = ta.value.trim();
  if (!val || state.isLoading) return;
  ta.value = '';
  ta.style.height = 'auto';
  _updateCharCount(0);
  _onSend(val);
}

export function setLoading(loading) {
  state.isLoading = loading;
  const btn = document.getElementById('send-btn');
  const ta  = document.getElementById('prompt-input');
  btn.disabled = loading || ta.value.trim().length === 0;
  btn.classList.toggle('loading', loading);
}

function _updateSendBtn(hasText) {
  if (state.isLoading) return;
  document.getElementById('send-btn').disabled = !hasText;
}

function _updateCharCount(n) {
  document.getElementById('char-count').textContent = `${n} chars`;
}

function _updateMsgCount() {
  document.getElementById('msg-count').textContent = `${state.messages.length} messages`;
}

function _scrollToBottom(container) {
  const wrap = container.closest('.messages-wrap');
  if (wrap) wrap.scrollTop = wrap.scrollHeight;
}
