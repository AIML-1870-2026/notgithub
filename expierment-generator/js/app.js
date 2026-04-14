/**
 * app.js — Entry point. Wires all UI interactions and orchestrates generation.
 */

import { initTheme, toggleTheme }                        from './theme.js';
import { parseMarkdown }                                  from './markdown.js';
import { buildPrompts }                                   from './prompts.js';
import { fetchAnalysis, renderAnalysis, renderAnalysisLoading } from './analysis.js';
import * as openai    from './providers/openai.js';
import * as anthropic from './providers/anthropic.js';
import * as gemini    from './providers/gemini.js';

// ── Provider Config ───────────────────────────────────────────

const PROVIDERS = {
  openai: {
    placeholder: 'sk-…',
    models:      ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
    validate:    k => k.startsWith('sk-') && !k.startsWith('sk-ant-'),
    validMsg:    '✓ Key format looks valid',
    invalidMsg:  '✗ Key should start with sk-',
    module:      openai,
    showProxy:   false,
  },
  anthropic: {
    placeholder: 'sk-ant-…',
    models:      ['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001'],
    validate:    k => k.startsWith('sk-ant-'),
    validMsg:    '✓ Key format looks valid',
    invalidMsg:  '✗ Key should start with sk-ant-',
    module:      anthropic,
    showProxy:   true,
  },
  gemini: {
    placeholder: 'AIza…',
    models:      ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash-exp'],
    validate:    k => k.startsWith('AIza'),
    validMsg:    '✓ Key format looks valid',
    invalidMsg:  '✗ Key should start with AIza',
    module:      gemini,
    showProxy:   false,
  },
};

// ── State ─────────────────────────────────────────────────────

const state = {
  provider:   'openai',
  apiKey:     '',
  model:      'gpt-4o',
  subject:    'General Science',
  gradeLevel: '6–8 (Ages 11–14)',
  difficulty: 50,
  duration:   50,
  detail:     50,
  generating: false,
};

// ── Boot ──────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

  _bindProviderTabs();
  _bindApiKey();
  _bindModelSelect();
  _bindSelects();
  _bindSliders();
  _bindGenerate();

  _populateModels('openai');
  _updateGenerateBtn();
});

// ── Provider Tabs ─────────────────────────────────────────────

function _bindProviderTabs() {
  document.querySelectorAll('.provider-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = btn.dataset.provider;
      if (p === state.provider) return;

      document.querySelectorAll('.provider-tab').forEach(b => {
        b.classList.toggle('active', b.dataset.provider === p);
        b.setAttribute('aria-selected', String(b.dataset.provider === p));
      });

      state.provider = p;
      state.apiKey   = '';

      const apiInput = document.getElementById('api-key-input');
      apiInput.value = '';
      apiInput.type  = 'password';
      apiInput.placeholder = PROVIDERS[p].placeholder;

      document.getElementById('key-status').textContent  = '';
      document.getElementById('key-status').className    = 'key-status';
      document.getElementById('proxy-notice').hidden     = !PROVIDERS[p].showProxy;
      document.getElementById('eye-open-icon').classList.remove('hidden');
      document.getElementById('eye-closed-icon').classList.add('hidden');

      _populateModels(p);
      _updateGenerateBtn();
    });
  });
}

// ── API Key ───────────────────────────────────────────────────

function _bindApiKey() {
  const input  = document.getElementById('api-key-input');
  const visBtn = document.getElementById('key-visibility-btn');

  const sync = () => {
    state.apiKey = input.value.trim();
    _validateKey();
    _updateGenerateBtn();
  };

  input.addEventListener('input',  sync);
  input.addEventListener('change', sync);
  input.addEventListener('blur',   sync);

  visBtn.addEventListener('click', () => {
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    document.getElementById('eye-open-icon').classList.toggle('hidden', show);
    document.getElementById('eye-closed-icon').classList.toggle('hidden', !show);
    visBtn.setAttribute('aria-label', show ? 'Hide key' : 'Show key');
  });
}

function _validateKey() {
  const statusEl = document.getElementById('key-status');
  const cfg      = PROVIDERS[state.provider];
  const key      = state.apiKey;

  if (!key) { statusEl.textContent = ''; statusEl.className = 'key-status'; return; }

  if (cfg.validate(key)) {
    statusEl.textContent = cfg.validMsg;
    statusEl.className   = 'key-status key-ok';
  } else {
    statusEl.textContent = cfg.invalidMsg;
    statusEl.className   = 'key-status key-err';
  }
}

// ── Model Select ──────────────────────────────────────────────

function _bindModelSelect() {
  document.getElementById('model-select').addEventListener('change', e => {
    state.model = e.target.value;
  });
}

function _populateModels(providerKey) {
  const select = document.getElementById('model-select');
  const models = PROVIDERS[providerKey].models;
  select.innerHTML = models.map(m => `<option value="${m}">${m}</option>`).join('');
  state.model = models[0] ?? '';
}

// ── Dropdowns ─────────────────────────────────────────────────

function _bindSelects() {
  document.getElementById('subject-select').addEventListener('change', e => {
    state.subject = e.target.value;
  });
  document.getElementById('grade-select').addEventListener('change', e => {
    state.gradeLevel = e.target.value;
  });
}

// ── Sliders ───────────────────────────────────────────────────

const SLIDERS = [
  { id: 'difficulty-slider', key: 'difficulty', labelId: 'difficulty-label', labels: ['Beginner', 'Intermediate', 'Advanced']      },
  { id: 'duration-slider',   key: 'duration',   labelId: 'duration-label',   labels: ['Quick',    'Standard',     'Extended']       },
  { id: 'detail-slider',     key: 'detail',     labelId: 'detail-label',     labels: ['Overview', 'Standard',     'Comprehensive']  },
];

function _bindSliders() {
  for (const { id, key, labelId, labels } of SLIDERS) {
    const slider = document.getElementById(id);
    slider.addEventListener('input', () => {
      state[key] = parseInt(slider.value, 10);
      _updateSliderLabel(labelId, state[key], labels);
      _updateSliderTrack(slider);
    });
    _updateSliderTrack(slider);
  }
}

function _updateSliderLabel(id, value, labels) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = value <= 25 ? labels[0] : value <= 75 ? labels[1] : labels[2];
}

function _updateSliderTrack(slider) {
  const pct = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
  slider.style.setProperty('--fill', `${pct}%`);
}

// ── Generate Button ───────────────────────────────────────────

function _updateGenerateBtn() {
  const supplies = document.getElementById('supplies-input')?.value.trim();
  document.getElementById('generate-btn').disabled =
    !state.apiKey || !supplies || state.generating;
}

function _bindGenerate() {
  document.getElementById('supplies-input').addEventListener('input', _updateGenerateBtn);
  document.getElementById('generate-btn').addEventListener('click', _handleGenerate);
  document.getElementById('regenerate-btn').addEventListener('click', _handleGenerate);
  document.getElementById('copy-btn').addEventListener('click', _copyExperiment);
  document.getElementById('download-btn').addEventListener('click', _downloadExperiment);
}

// ── Generation Flow ───────────────────────────────────────────

async function _handleGenerate() {
  if (state.generating) return;

  const apiKey   = document.getElementById('api-key-input').value.trim();
  const supplies = document.getElementById('supplies-input').value.trim();
  const context  = document.getElementById('context-input').value.trim();

  if (!apiKey)   { _showToast('Enter your API key first.'); return; }
  if (!supplies) { _showToast('List your available supplies first.'); return; }

  _setGenerating(true);
  _showOutput();
  _clearOutput();

  const { systemPrompt, userPrompt } = buildPrompts({
    subject:    state.subject,
    gradeLevel: state.gradeLevel,
    supplies,
    context,
    difficulty: state.difficulty,
    duration:   state.duration,
    detail:     state.detail,
  });

  const provider = PROVIDERS[state.provider].module;
  let fullText   = '';

  try {
    // 1. Stream experiment text
    const outputEl = document.getElementById('experiment-output');
    for await (const chunk of provider.sendMessage({
      messages:    [{ role: 'user', content: userPrompt }],
      model:       state.model,
      temperature: 0.75,
      maxTokens:   2200,
      systemPrompt,
      apiKey,
      schema:      null,
    })) {
      fullText += chunk;
      outputEl.innerHTML = parseMarkdown(fullText);
    }

    // 2. Fetch structured analysis
    const analysisPanel = document.getElementById('analysis-panel');
    renderAnalysisLoading(analysisPanel);

    const analysis = await fetchAnalysis({
      sendMessageFn: provider.sendMessage.bind(provider),
      apiKey,
      model:        state.model,
      gradeLevel:   state.gradeLevel,
      experimentText: fullText,
    });

    renderAnalysis(analysis, analysisPanel);

    // Show action buttons
    document.getElementById('copy-btn').hidden      = false;
    document.getElementById('download-btn').hidden  = false;
    document.getElementById('regenerate-btn').hidden = false;

  } catch (err) {
    console.error('[Experiment Generator]', err);
    _showExperimentError(err.message);
    document.getElementById('analysis-panel').hidden = true;
  } finally {
    _setGenerating(false);
  }
}

// ── UI Helpers ────────────────────────────────────────────────

function _setGenerating(on) {
  state.generating = on;
  const btn      = document.getElementById('generate-btn');
  const spinner  = document.getElementById('generate-spinner');
  const btnIcon  = document.getElementById('generate-icon');
  const btnText  = document.getElementById('generate-text');
  const regenBtn = document.getElementById('regenerate-btn');

  btn.disabled          = on;
  spinner.hidden        = !on;
  btnIcon.style.display = on ? 'none' : '';
  btnText.textContent   = on ? 'Generating…' : 'Generate Experiment';
  if (regenBtn) regenBtn.disabled = on;

  _updateGenerateBtn();
}

function _showOutput() {
  const section = document.getElementById('output-section');
  section.hidden = false;
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function _clearOutput() {
  document.getElementById('experiment-output').innerHTML =
    '<div class="output-placeholder">Generating your experiment…</div>';
  document.getElementById('copy-btn').hidden      = true;
  document.getElementById('download-btn').hidden  = true;
  document.getElementById('regenerate-btn').hidden = true;
  document.getElementById('analysis-panel').hidden = true;
}

function _showExperimentError(msg) {
  document.getElementById('experiment-output').innerHTML =
    `<div class="output-error"><strong>Error:</strong> ${_esc(msg)}</div>`;
}

async function _copyExperiment() {
  const el   = document.getElementById('experiment-output');
  const text = el.innerText || el.textContent;

  try {
    await navigator.clipboard.writeText(text);
    const btn  = document.getElementById('copy-btn');
    const orig = btn.innerHTML;
    btn.innerHTML = `<svg class="btn-icon" viewBox="0 0 24 24" fill="none">
      <polyline points="20 6 9 17 4 12" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round"/></svg> Copied!`;
    setTimeout(() => { btn.innerHTML = orig; }, 2000);
  } catch {
    _showToast('Could not copy — try selecting the text manually.');
  }
}

function _downloadExperiment() {
  const el       = document.getElementById('experiment-output');
  const text     = el.innerText || el.textContent;
  const subject  = state.subject.replace(/\s+/g, '-');
  const grade    = state.gradeLevel.split(' ')[0].replace(/[^a-zA-Z0-9–-]/g, '');
  const filename = `experiment-${subject}-${grade}.txt`;

  const blob = new Blob([text], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Toast ─────────────────────────────────────────────────────

function _showToast(msg) {
  let toast = document.getElementById('exgen-toast');
  if (!toast) {
    toast    = document.createElement('div');
    toast.id = 'exgen-toast';
    document.body.appendChild(toast);
  }
  toast.className   = 'toast';
  toast.textContent = msg;
  toast.setAttribute('aria-live', 'assertive');

  toast.classList.remove('toast-show');
  void toast.offsetWidth;
  toast.classList.add('toast-show');

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('toast-show'), 3000);
}

function _esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
