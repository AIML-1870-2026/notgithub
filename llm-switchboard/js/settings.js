/**
 * settings.js — Sidebar UI: provider tabs, model dropdown,
 *               API key, sliders, system prompt, collapsibles.
 */

import { state } from './state.js';

// ── Callbacks registered by app.js ───────────────────────────
let _onProviderChange = () => {};
let _onSend           = () => {};

export function onProviderChange(fn) { _onProviderChange = fn; }
export function onSendRequest(fn)    { _onSend = fn; }

// ── Init ─────────────────────────────────────────────────────
export function initSettings() {
  _bindProviderTabs();
  _bindModelSelect();
  _bindApiKey();
  _bindSliders();
  _bindSystemPrompt();
  _bindCollapsible('system-trigger', 'system-body');
  _bindClearBtn();
  _populateModels(state.provider);
  _syncModePill();
}

// ── Provider Tabs ─────────────────────────────────────────────
function _bindProviderTabs() {
  const tabs = document.querySelectorAll('.provider-btn');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      const provider = btn.dataset.provider;
      if (provider === state.provider) return;

      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');

      state.provider = provider;
      state.model    = state.modelsByProvider[provider][0].id;
      _populateModels(provider);
      _onProviderChange(provider);
    });
  });
}

function _populateModels(provider) {
  const sel = document.getElementById('model-select');
  sel.innerHTML = state.modelsByProvider[provider]
    .map(m => `<option value="${m.id}">${m.label}</option>`)
    .join('');
  sel.value = state.model;
}

// ── Model Select ──────────────────────────────────────────────
function _bindModelSelect() {
  document.getElementById('model-select').addEventListener('change', e => {
    state.model = e.target.value;
  });
}

// ── API Key ───────────────────────────────────────────────────
function _bindApiKey() {
  const input  = document.getElementById('api-key-input');
  const toggle = document.getElementById('key-visibility-btn');
  const eyeOpen   = document.getElementById('eye-open-icon');
  const eyeClosed = document.getElementById('eye-closed-icon');
  const status    = document.getElementById('key-status');

  // Restore saved key for current provider
  input.value = state.apiKeys[state.provider] || '';

  input.addEventListener('input', () => {
    const key = input.value.trim();
    state.apiKeys[state.provider] = key;
    _updateKeyStatus(key, status);
  });

  toggle.addEventListener('click', () => {
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    eyeOpen.classList.toggle('hidden', isPassword);
    eyeClosed.classList.toggle('hidden', !isPassword);
    toggle.setAttribute('aria-label', isPassword ? 'Hide key' : 'Show key');
  });
}

function _updateKeyStatus(key, el) {
  if (!key) {
    el.textContent = '';
    el.className = 'key-status';
    return;
  }
  const looks = _looksValid(key, state.provider);
  el.textContent = looks ? 'Key format looks valid' : 'Key format looks unusual';
  el.className = `key-status ${looks ? 'valid' : 'invalid'}`;
}

function _looksValid(key, provider) {
  if (provider === 'openai')    return key.startsWith('sk-');
  if (provider === 'anthropic') return key.startsWith('sk-ant-');
  if (provider === 'gemini')    return key.length > 20;
  return true;
}

/** Called when provider tab switches — updates key input + status */
export function syncKeyInput() {
  const input  = document.getElementById('api-key-input');
  const status = document.getElementById('key-status');
  input.value  = state.apiKeys[state.provider] || '';
  _updateKeyStatus(input.value.trim(), status);
}

// ── Sliders ───────────────────────────────────────────────────
function _bindSliders() {
  const tempSlider   = document.getElementById('temperature-slider');
  const tempValue    = document.getElementById('temperature-value');
  const tokensSlider = document.getElementById('tokens-slider');
  const tokensValue  = document.getElementById('tokens-value');

  tempSlider.addEventListener('input', () => {
    state.temperature = parseFloat(tempSlider.value);
    tempValue.textContent = state.temperature.toFixed(2);
    _updateSliderFill(tempSlider);
  });

  tokensSlider.addEventListener('input', () => {
    state.maxTokens = parseInt(tokensSlider.value, 10);
    tokensValue.textContent = state.maxTokens.toLocaleString();
    _updateSliderFill(tokensSlider);
  });

  _updateSliderFill(tempSlider);
  _updateSliderFill(tokensSlider);
}

function _updateSliderFill(slider) {
  const min = parseFloat(slider.min);
  const max = parseFloat(slider.max);
  const val = parseFloat(slider.value);
  const pct = ((val - min) / (max - min)) * 100;
  slider.style.background = `linear-gradient(to right, var(--accent) ${pct}%, var(--surface-3) ${pct}%)`;
}

// ── System Prompt ─────────────────────────────────────────────
function _bindSystemPrompt() {
  document.getElementById('system-prompt-input').addEventListener('input', e => {
    state.systemPrompt = e.target.value;
  });
}

// ── Collapsible ───────────────────────────────────────────────
function _bindCollapsible(triggerId, bodyId) {
  const trigger = document.getElementById(triggerId);
  const body    = document.getElementById(bodyId);

  trigger.addEventListener('click', () => {
    const expanded = trigger.getAttribute('aria-expanded') === 'true';
    trigger.setAttribute('aria-expanded', String(!expanded));
    body.setAttribute('aria-hidden', String(expanded));
    body.classList.toggle('open', !expanded);
  });
}

// ── Clear Button ──────────────────────────────────────────────
function _bindClearBtn() {
  document.getElementById('clear-btn').addEventListener('click', () => {
    if (state.messages.length === 0) return;
    state.messages = [];
    // Notify chat module via custom event
    document.dispatchEvent(new CustomEvent('llm:clear'));
  });
}

// ── Mode Pill (segmented control animation) ───────────────────
export function _syncModePill() {
  const active = document.querySelector(`.mode-btn[data-mode="${state.mode}"]`);
  const pill   = document.getElementById('mode-pill');
  if (!active || !pill) return;
  pill.style.left  = active.offsetLeft + 'px';
  pill.style.width = active.offsetWidth + 'px';
}
