/**
 * analysis.js — Structured experiment analysis: safety, time, concepts, materials.
 *
 * After the experiment text is streamed, a second API call (non-streaming) fetches
 * a structured JSON breakdown and renders it into the analysis panel.
 */

export const ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    safety_rating: {
      type: 'object',
      properties: {
        score:   { type: 'number'  },
        summary: { type: 'string' },
      },
      required: ['score', 'summary'],
      additionalProperties: false,
    },
    estimated_minutes: { type: 'number' },
    science_concepts: {
      type:  'array',
      items: { type: 'string' },
    },
    materials_checklist: {
      type:  'array',
      items: {
        type: 'object',
        properties: {
          item:      { type: 'string'  },
          essential: { type: 'boolean' },
        },
        required: ['item', 'essential'],
        additionalProperties: false,
      },
    },
  },
  required: ['safety_rating', 'estimated_minutes', 'science_concepts', 'materials_checklist'],
  additionalProperties: false,
};

/**
 * Call the provider with a structured schema and return the parsed analysis object.
 *
 * @param {object} opts
 * @param {Function} opts.sendMessageFn   Provider's sendMessage async generator
 * @param {string}   opts.apiKey
 * @param {string}   opts.model
 * @param {string}   opts.gradeLevel
 * @param {string}   opts.experimentText  Full streamed experiment text
 * @returns {Promise<object>}
 */
export async function fetchAnalysis({ sendMessageFn, apiKey, model, gradeLevel, experimentText }) {
  const systemPrompt = 'You are a science education safety expert. Analyze experiments accurately and concisely.';
  const userPrompt = [
    `Grade Level: ${gradeLevel}`,
    '',
    `Experiment:\n${experimentText}`,
    '',
    'Provide: safety_rating (score 1–10 where 10 = perfectly safe for the grade, plus a one-sentence summary), ' +
    'estimated_minutes to complete, science_concepts (array of short concept names, max 8), ' +
    'and materials_checklist (each item labeled essential true/false).',
  ].join('\n');

  const chunks = [];
  for await (const chunk of sendMessageFn({
    messages:     [{ role: 'user', content: userPrompt }],
    model,
    temperature:  0.2,
    maxTokens:    700,
    systemPrompt,
    apiKey,
    schema: ANALYSIS_SCHEMA,
  })) {
    chunks.push(chunk);
  }

  return JSON.parse(chunks.join(''));
}

/**
 * Render the analysis data into the given container element.
 *
 * @param {object}      data
 * @param {HTMLElement} container
 */
export function renderAnalysis(data, container) {
  const safetyScore = Math.min(10, Math.max(1, Math.round(data.safety_rating?.score ?? 5)));
  const safetyColor = safetyScore >= 8 ? 'var(--score-high)' : safetyScore >= 5 ? 'var(--score-mid)' : 'var(--score-low)';

  const concepts  = (data.science_concepts ?? []).slice(0, 8);
  const materials = data.materials_checklist ?? [];
  const essential = materials.filter(m => m.essential);
  const optional  = materials.filter(m => !m.essential);

  container.innerHTML = `
    <div class="analysis-grid">

      <div class="analysis-card">
        <div class="analysis-card-label">Safety Rating</div>
        <div class="analysis-score-row">
          <span class="analysis-score" style="color:${safetyColor}">${safetyScore}</span>
          <span class="analysis-score-denom">/10</span>
        </div>
        <div class="score-bar-track">
          <div class="score-bar-fill" style="width:${safetyScore * 10}%;background:${safetyColor}"></div>
        </div>
        <p class="analysis-summary">${_esc(data.safety_rating?.summary ?? '')}</p>
      </div>

      <div class="analysis-card">
        <div class="analysis-card-label">Estimated Time</div>
        <div class="time-display">
          <span class="time-number">${data.estimated_minutes ?? '?'}</span>
          <span class="time-unit">min</span>
        </div>
        <p class="analysis-summary">${_timeLabel(data.estimated_minutes)}</p>
      </div>

      <div class="analysis-card concepts-card">
        <div class="analysis-card-label">Science Concepts</div>
        <div class="concept-tags">
          ${concepts.map(c => `<span class="concept-tag">${_esc(c)}</span>`).join('')}
          ${concepts.length === 0 ? '<span class="analysis-summary">None identified</span>' : ''}
        </div>
      </div>

    </div>

    <div class="materials-section">
      <div class="materials-header">
        <svg class="materials-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 11l3 3L22 4" stroke="currentColor" stroke-width="1.5"
                stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"
                stroke="currentColor" stroke-width="1.5"
                stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="materials-title">Materials Checklist</span>
      </div>
      <div class="materials-list">
        ${essential.map(m => _materialRow(m.item, true)).join('')}
        ${optional.map(m  => _materialRow(m.item, false)).join('')}
        ${materials.length === 0 ? '<p class="analysis-summary" style="padding:8px 0">No materials listed.</p>' : ''}
      </div>
    </div>
  `;
}

/**
 * Render loading skeleton placeholders while analysis is being fetched.
 * @param {HTMLElement} container
 */
export function renderAnalysisLoading(container) {
  container.hidden = false;
  container.innerHTML = `
    <div class="analysis-grid">
      <div class="analysis-card loading-card"><div class="shimmer"></div></div>
      <div class="analysis-card loading-card"><div class="shimmer"></div></div>
      <div class="analysis-card loading-card"><div class="shimmer"></div></div>
    </div>
    <div class="materials-section loading-card" style="height:120px"><div class="shimmer"></div></div>
  `;
}

// ── Helpers ───────────────────────────────────────────────────

function _materialRow(item, essential) {
  return `
    <label class="material-item">
      <input type="checkbox" class="material-check" aria-label="${_esc(item)}">
      <span class="material-checkmark" aria-hidden="true">
        <svg viewBox="0 0 12 12" fill="none"><polyline points="2 6 5 9 10 3"
          stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </span>
      <span class="material-name">${_esc(item)}</span>
      <span class="material-badge ${essential ? 'essential' : 'optional'}">${essential ? 'Essential' : 'Optional'}</span>
    </label>`;
}

function _timeLabel(mins) {
  if (!mins) return '';
  if (mins <= 15) return 'Quick demo or warm-up';
  if (mins <= 30) return 'Short activity';
  if (mins <= 60) return 'Standard class period';
  if (mins <= 90) return 'Extended session';
  return 'Multi-session project';
}

function _esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
