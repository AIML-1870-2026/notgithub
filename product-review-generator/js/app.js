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
  apiKey:       '',
  modelFamily:  'GPT-4o',
  model:        'gpt-4o',
  tone:         50,    // 0 = Professional, 100 = Casual
  length:       50,    // 0 = Concise, 100 = Detailed
  humor:        50,    // 0 = Serious, 100 = Hilarious
  technicality: 50,    // 0 = Layman, 100 = Expert
  enthusiasm:   50,    // 0 = Stoic, 100 = Hype
  generating:   false,
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

  const syncKey = () => {
    state.apiKey = input.value.trim();
    _validateKey();
    _updateGenerateBtn();
  };

  input.addEventListener('input',  syncKey);
  input.addEventListener('change', syncKey);  // catches password-manager autofill
  input.addEventListener('blur',   syncKey);

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
  const sliders = [
    { id: 'tone-slider',   stateKey: 'tone',         labelId: 'tone-label',   labels: ['Professional', 'Balanced',  'Casual']   },
    { id: 'length-slider', stateKey: 'length',        labelId: 'length-label', labels: ['Concise',      'Moderate',  'Detailed'] },
    { id: 'humor-slider',  stateKey: 'humor',         labelId: 'humor-label',  labels: ['Serious',      'Neutral',   'Hilarious'] },
    { id: 'tech-slider',   stateKey: 'technicality',  labelId: 'tech-label',   labels: ['Layman',       'General',   'Expert']   },
    { id: 'hype-slider',   stateKey: 'enthusiasm',    labelId: 'hype-label',   labels: ['Stoic',        'Balanced',  'Hype']     },
  ];

  for (const { id, stateKey, labelId, labels } of sliders) {
    const slider = document.getElementById(id);
    slider.addEventListener('input', () => {
      state[stateKey] = parseInt(slider.value, 10);
      _updateSliderLabel(labelId, state[stateKey], labels);
      _updateSliderTrack(slider);
    });
    _updateSliderTrack(slider);
  }
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

  // Always read directly from DOM to catch autofill that bypassed the input event
  const apiKey      = document.getElementById('api-key-input').value.trim();
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
    humor: state.humor, technicality: state.technicality, enthusiasm: state.enthusiasm,
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

function _buildPrompts({ productName, productDesc, category, features, tone, length, humor, technicality, enthusiasm }) {
  const toneDesc = tone <= 25  ? 'formal and professional'
                 : tone <= 75  ? 'balanced and informative'
                 :               'conversational and casual';

  const lengthDesc = length <= 25 ? 'concise (150–250 words)'
                   : length <= 75  ? 'moderate (300–450 words)'
                   :                 'detailed and thorough (500–700 words)';

  const humorDesc = humor <= 25  ? 'Keep the tone completely serious — no humor or jokes whatsoever.'
                  : humor <= 75  ? 'Occasionally use light wit or a clever turn of phrase, but stay mostly informative.'
                  :               'Be funny and entertaining throughout — use puns, jokes, and witty observations. Make the reader laugh while still being informative.';

  const techDesc = technicality <= 25  ? 'Use simple, everyday language a non-technical consumer would understand. Avoid all jargon.'
                 : technicality <= 75  ? 'Use moderate technical depth appropriate for a general audience.'
                 :                       'Write at an expert level with precise technical specifications, industry terminology, and deep analysis of engineering choices.';

  const hypeDesc = enthusiasm <= 25  ? 'Be measured and stoic — state facts plainly, avoid exclamation points and superlatives.'
                 : enthusiasm <= 75  ? 'Be positive but grounded — show genuine enthusiasm where warranted.'
                 :                     'Be extremely enthusiastic and energetic! Use exclamation points freely! Gush about the good parts! Make the reader feel the excitement!';

  const systemPrompt = [
    `You are an expert product reviewer. Always structure your review with these markdown sections: ## Overview, ## Pros, ## Cons, ## Verdict. Use bullet points for pros and cons.`,
    `Tone: ${toneDesc}`,
    `Length: ${lengthDesc}`,
    `Humor: ${humorDesc}`,
    `Technical depth: ${techDesc}`,
    `Enthusiasm: ${hypeDesc}`,
  ].join('\n');

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
  document.getElementById('star-rating-panel').hidden = true;
  _hideSentiment();
}

function _showReviewError(msg) {
  document.getElementById('review-output').innerHTML =
    `<div class="output-error"><strong>Error:</strong> ${_escapeHtml(msg)}</div>`;
}

function _showSentimentLoading() {
  // Star rating loading state
  const starPanel = document.getElementById('star-rating-panel');
  starPanel.hidden = false;
  starPanel.innerHTML = `<div class="star-rating-card loading-card"><div class="shimmer"></div></div>`;

  // Sentiment cards loading state
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
  // ── Star Rating ──────────────────────────────────────────────
  const rawRating = data.overall_rating ?? 0;
  const rating    = Math.min(5, Math.max(0, Math.round(rawRating * 2) / 2)); // clamp, snap to 0.5

  const starPanel = document.getElementById('star-rating-panel');
  starPanel.innerHTML = `
    <div class="star-rating-card">
      <div class="star-row" aria-label="${rating} out of 5 stars">
        ${_buildStarSvgs(rating)}
      </div>
      <div class="star-numeric">
        <span class="star-number">${rating.toFixed(1)}</span>
        <span class="star-out-of">out of 5</span>
      </div>
      <p class="star-label">Overall Rating</p>
    </div>`;

  // Animate stars in after a brief paint delay
  requestAnimationFrame(() => {
    starPanel.querySelectorAll('.star-wrap').forEach((star, i) => {
      star.style.animationDelay = `${i * 80}ms`;
      star.classList.add('star-animate');
    });
  });

  // ── Sentiment Cards ──────────────────────────────────────────
  const panel   = document.getElementById('sentiment-panel');
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

  // Show copy + regenerate
  document.getElementById('copy-btn').hidden = false;
  document.getElementById('regenerate-btn').hidden = false;
}

/**
 * Build 5 SVG star elements supporting half-star fills.
 * Each star uses two layers: an empty base + a filled layer clipped by fill %.
 */
function _buildStarSvgs(rating) {
  const starPath = 'M12 2L14.5 9.5H22L16 14L18.5 21.5L12 17L5.5 21.5L8 14L2 9.5H9.5L12 2Z';
  let html = '';

  for (let i = 1; i <= 5; i++) {
    const fill    = Math.min(1, Math.max(0, rating - (i - 1))); // 0, 0.5, or 1
    const clipPct = Math.round(fill * 100);                      // right-clip: 100-clipPct %

    html += `
      <span class="star-wrap" aria-hidden="true">
        <svg class="star-svg star-empty" viewBox="0 0 24 24" fill="none">
          <path d="${starPath}" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
        </svg>
        <svg class="star-svg star-filled" viewBox="0 0 24 24"
             style="clip-path:inset(0 ${100 - clipPct}% 0 0)">
          <path d="${starPath}" fill="currentColor"/>
        </svg>
      </span>`;
  }

  return html;
}

function _hideSentiment() {
  document.getElementById('sentiment-panel').hidden = true;
  document.getElementById('star-rating-panel').hidden = true;
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
