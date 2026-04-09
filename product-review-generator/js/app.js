/**
 * app.js — Entry point. Wires all UI interactions and orchestrates generation.
 */

import { initTheme, toggleTheme } from './theme.js';
import { streamReview, fetchSentiment } from './openai.js';
import { parseMarkdown } from './markdown.js';

// ── Model Data ────────────────────────────────────────────────

const MODEL_FAMILIES = {
  'GPT-4o':      ['gpt-4o', 'gpt-4o-mini'],
  'GPT-4 Turbo': ['gpt-4-turbo'],
  'GPT-3.5':     ['gpt-3.5-turbo'],
};

// ── In-Memory State ───────────────────────────────────────────

const state = {
  apiKey:      '',
  modelFamily: 'GPT-4o',
  model:       'gpt-4o',
  tone:        50,    // 0 = Professional, 100 = Casual
  length:      50,    // 0 = Concise, 100 = Detailed
  generating:  false,
};

// ── Boot ──────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  _bindThemeToggle();
  _bindApiKey();
  _bindModelFamily();
  _bindSliders();
  _bindGenerate();
  _populateModelDropdown('GPT-4o');
  _updateGenerateBtn();
});

// ── Theme ─────────────────────────────────────────────────────

function _bindThemeToggle() {
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
}

// ── API Key ───────────────────────────────────────────────────

function _bindApiKey() {
  const input      = document.getElementById('api-key-input');
  const visBtn     = document.getElementById('key-visibility-btn');
  const eyeOpen    = document.getElementById('eye-open-icon');
  const eyeClosed  = document.getElementById('eye-closed-icon');

  input.addEventListener('input', () => {
    state.apiKey = input.value.trim();
    _validateKey();
    _updateGenerateBtn();
  });

  input.addEventListener('blur', _validateKey);

  visBtn.addEventListener('click', () => {
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    eyeOpen.classList.toggle('hidden', isHidden);
    eyeClosed.classList.toggle('hidden', !isHidden);
    visBtn.setAttribute('aria-label', isHidden ? 'Hide key' : 'Show key');
  });
}

function _validateKey() {
  const statusEl = document.getElementById('key-status');
  const key      = state.apiKey;

  if (!key) {
    statusEl.textContent = '';
    statusEl.className   = 'key-status';
    return;
  }

  if (key.startsWith('sk-')) {
    statusEl.textContent = '✓ Key format looks valid';
    statusEl.className   = 'key-status key-ok';
  } else {
    statusEl.textContent = '✗ Key should start with sk-';
    statusEl.className   = 'key-status key-err';
  }
}

// ── Model Selection ───────────────────────────────────────────

function _bindModelFamily() {
  document.getElementById('model-family-select').addEventListener('change', e => {
    state.modelFamily = e.target.value;
    _populateModelDropdown(state.modelFamily);
  });

  document.getElementById('model-select').addEventListener('change', e => {
    state.model = e.target.value;
  });
}

function _populateModelDropdown(family) {
  const select = document.getElementById('model-select');
  const models = MODEL_FAMILIES[family] || [];

  select.innerHTML = models
    .map(m => `<option value="${m}">${m}</option>`)
    .join('');

  state.model = models[0] || '';
}

// ── Sliders ───────────────────────────────────────────────────

function _bindSliders() {
  const toneSlider   = document.getElementById('tone-slider');
  const lengthSlider = document.getElementById('length-slider');

  toneSlider.addEventListener('input', () => {
    state.tone = parseInt(toneSlider.value, 10);
    _updateSliderLabel('tone-label', state.tone, ['Professional', 'Balanced', 'Casual']);
    _updateSliderTrack(toneSlider);
  });

  lengthSlider.addEventListener('input', () => {
    state.length = parseInt(lengthSlider.value, 10);
    _updateSliderLabel('length-label', state.length, ['Concise', 'Moderate', 'Detailed']);
    _updateSliderTrack(lengthSlider);
  });

  // Init tracks
  _updateSliderTrack(toneSlider);
  _updateSliderTrack(lengthSlider);
}

function _updateSliderLabel(id, value, labels) {
  const el = document.getElementById(id);
  if (!el) return;
  if (value <= 25)      el.textContent = labels[0];
  else if (value <= 75) el.textContent = labels[1];
  else                  el.textContent = labels[2];
}

function _updateSliderTrack(slider) {
  const pct = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
  slider.style.setProperty('--fill', `${pct}%`);
}

// ── Generate Button State ─────────────────────────────────────

function _updateGenerateBtn() {
  const btn         = document.getElementById('generate-btn');
  const productName = document.getElementById('product-name').value.trim();
  const desc        = document.getElementById('product-desc').value.trim();
  btn.disabled      = !state.apiKey || !productName || !desc || state.generating;
}

// ── Product Input Fields ──────────────────────────────────────

function _bindGenerate() {
  document.getElementById('product-name').addEventListener('input', _updateGenerateBtn);
  document.getElementById('product-desc').addEventListener('input', _updateGenerateBtn);
  document.getElementById('generate-btn').addEventListener('click', _handleGenerate);
  document.getElementById('copy-btn').addEventListener('click', _copyReview);
  document.getElementById('regenerate-btn').addEventListener('click', _handleGenerate);
}

// ── Generation Flow ───────────────────────────────────────────

async function _handleGenerate() {
  if (state.generating) return;

  const apiKey      = state.apiKey;
  const productName = document.getElementById('product-name').value.trim();
  const productDesc = document.getElementById('product-desc').value.trim();
  const category    = document.getElementById('product-category').value.trim();
  const features    = document.getElementById('product-features').value.trim();

  if (!apiKey) { _showToast('Enter your OpenAI API key first.'); return; }
  if (!productName) { _showToast('Product name is required.'); return; }
  if (!productDesc) { _showToast('Product description is required.'); return; }

  _setGenerating(true);
  _showOutput();
  _clearOutput();

  const { systemPrompt, userPrompt } = _buildPrompts({
    productName, productDesc, category, features,
    tone: state.tone, length: state.length,
  });

  let fullReview = '';

  try {
    // 1. Stream the review
    const outputEl = document.getElementById('review-output');
    const generator = streamReview({ apiKey, model: state.model, systemPrompt, userPrompt });

    for await (const chunk of generator) {
      fullReview += chunk;
      outputEl.innerHTML = parseMarkdown(fullReview);
      outputEl.scrollTop = outputEl.scrollHeight;
    }

    // 2. Fetch sentiment analysis in parallel (fire after review is done)
    _showSentimentLoading();
    const sentiment = await fetchSentiment({
      apiKey,
      model: state.model,
      productName,
      reviewText: fullReview,
    });
    _renderSentiment(sentiment);

  } catch (err) {
    console.error('[Product Review Generator]', err);
    _showReviewError(err.message);
    _hideSentiment();
  } finally {
    _setGenerating(false);
  }
}

// ── Prompt Builder ────────────────────────────────────────────

function _buildPrompts({ productName, productDesc, category, features, tone, length }) {
  const toneDesc   = tone <= 25  ? 'formal and professional'
                   : tone <= 75  ? 'balanced and informative'
                   :               'conversational and casual';

  const lengthDesc = length <= 25 ? 'concise (150–250 words)'
                   : length <= 75  ? 'moderate (300–450 words)'
                   :                 'detailed and thorough (500–700 words)';

  const systemPrompt = `You are an expert product reviewer with years of experience writing clear, balanced, and helpful reviews. Write reviews in a ${toneDesc} tone. Target length: ${lengthDesc}. Always structure your review with these markdown sections: ## Overview, ## Pros, ## Cons, ## Verdict. Use bullet points for pros and cons. Be honest, specific, and useful to potential buyers.`;

  const parts = [
    `Write a product review for: **${productName}**`,
    `\nDescription: ${productDesc}`,
  ];
  if (category) parts.push(`Category: ${category}`);
  if (features) parts.push(`Key Features: ${features}`);

  return { systemPrompt, userPrompt: parts.join('\n') };
}

// ── UI Helpers ────────────────────────────────────────────────

function _setGenerating(on) {
  state.generating = on;
  const btn        = document.getElementById('generate-btn');
  const spinner    = document.getElementById('generate-spinner');
  const btnText    = document.getElementById('generate-text');
  const regenBtn   = document.getElementById('regenerate-btn');

  btn.disabled      = on;
  spinner.hidden    = !on;
  btnText.textContent = on ? 'Generating…' : 'Generate Review';
  regenBtn.disabled = on;
  _updateGenerateBtn();
}

function _showOutput() {
  document.getElementById('output-section').hidden = false;
  document.getElementById('output-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function _clearOutput() {
  document.getElementById('review-output').innerHTML = '<div class="output-placeholder">Generating your review…</div>';
  document.getElementById('copy-btn').hidden = true;
  document.getElementById('regenerate-btn').hidden = true;
  _hideSentiment();
}

function _showReviewError(msg) {
  document.getElementById('review-output').innerHTML =
    `<div class="output-error"><strong>Error:</strong> ${_escapeHtml(msg)}</div>`;
}

function _showSentimentLoading() {
  const panel = document.getElementById('sentiment-panel');
  panel.hidden = false;
  panel.innerHTML = `
    <h3 class="sentiment-title">Sentiment Analysis</h3>
    <div class="sentiment-cards">
      <div class="sentiment-card loading-card"><div class="shimmer"></div></div>
      <div class="sentiment-card loading-card"><div class="shimmer"></div></div>
      <div class="sentiment-card loading-card"><div class="shimmer"></div></div>
    </div>`;
}

function _renderSentiment(data) {
  const panel = document.getElementById('sentiment-panel');
  const aspects = [
    { key: 'price_value', label: 'Price / Value', icon: '💰' },
    { key: 'features',    label: 'Features',      icon: '⚙️' },
    { key: 'usability',   label: 'Usability',     icon: '✋' },
  ];

  const cardsHtml = aspects.map(({ key, label, icon }) => {
    const item  = data[key] || { score: 0, summary: 'N/A' };
    const score = Math.min(10, Math.max(1, Math.round(item.score)));
    const pct   = (score / 10) * 100;
    const color = score >= 8 ? 'var(--score-high)' : score >= 5 ? 'var(--score-mid)' : 'var(--score-low)';

    return `
      <div class="sentiment-card">
        <div class="sentiment-card-top">
          <span class="sentiment-icon" aria-hidden="true">${icon}</span>
          <span class="sentiment-label">${label}</span>
          <span class="sentiment-score" style="color:${color}">${score}<span class="sentiment-denom">/10</span></span>
        </div>
        <div class="score-bar-track">
          <div class="score-bar-fill" style="width:${pct}%;background:${color}"></div>
        </div>
        <p class="sentiment-summary">${_escapeHtml(item.summary)}</p>
      </div>`;
  }).join('');

  panel.innerHTML = `
    <h3 class="sentiment-title">Sentiment Analysis</h3>
    <div class="sentiment-cards">${cardsHtml}</div>`;

  // Show copy + regenerate after everything is done
  document.getElementById('copy-btn').hidden = false;
  document.getElementById('regenerate-btn').hidden = false;
}

function _hideSentiment() {
  document.getElementById('sentiment-panel').hidden = true;
}

async function _copyReview() {
  const outputEl = document.getElementById('review-output');
  const text     = outputEl.innerText || outputEl.textContent;

  try {
    await navigator.clipboard.writeText(text);
    const btn = document.getElementById('copy-btn');
    const orig = btn.innerHTML;
    btn.innerHTML = `<svg class="btn-icon" viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Copied!`;
    setTimeout(() => { btn.innerHTML = orig; }, 2000);
  } catch {
    _showToast('Could not copy — try selecting the text manually.');
  }
}

// ── Toast ─────────────────────────────────────────────────────

function _showToast(msg) {
  let toast = document.getElementById('prg-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'prg-toast';
    document.body.appendChild(toast);
  }
  toast.className   = 'toast';
  toast.textContent = msg;
  toast.setAttribute('aria-live', 'assertive');

  // Trigger animation
  toast.classList.remove('toast-show');
  void toast.offsetWidth; // reflow
  toast.classList.add('toast-show');

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('toast-show'), 3000);
}

// ── Utilities ─────────────────────────────────────────────────

function _escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
