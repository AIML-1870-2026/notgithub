/**
 * schema.js — JSON Schema editor, template loader, and
 *             syntax-highlighted JSON response viewer.
 */

import { state } from './state.js';

// ── Example schema templates ──────────────────────────────────
const TEMPLATES = {
  basic: {
    type: 'object',
    properties: {
      answer:     { type: 'string', description: 'The direct answer' },
      confidence: { type: 'number', description: 'Confidence score 0-1' },
    },
    required: ['answer', 'confidence'],
    additionalProperties: false,
  },

  person: {
    type: 'object',
    properties: {
      name:        { type: 'string' },
      age:         { type: 'integer', minimum: 0 },
      occupation:  { type: 'string' },
      skills:      { type: 'array', items: { type: 'string' } },
      location:    {
        type: 'object',
        properties: {
          city:    { type: 'string' },
          country: { type: 'string' },
        },
        required: ['city', 'country'],
        additionalProperties: false,
      },
    },
    required: ['name', 'age', 'occupation', 'skills'],
    additionalProperties: false,
  },

  sentiment: {
    type: 'object',
    properties: {
      sentiment:    { type: 'string', enum: ['positive', 'negative', 'neutral', 'mixed'] },
      score:        { type: 'number', minimum: -1, maximum: 1, description: 'Sentiment score from -1 (negative) to 1 (positive)' },
      emotions:     { type: 'array', items: { type: 'string' }, description: 'Detected emotions' },
      key_phrases:  { type: 'array', items: { type: 'string' }, description: 'Notable phrases' },
      reasoning:    { type: 'string', description: 'Brief explanation' },
    },
    required: ['sentiment', 'score', 'emotions', 'key_phrases', 'reasoning'],
    additionalProperties: false,
  },

  product: {
    type: 'object',
    properties: {
      name:          { type: 'string' },
      category:      { type: 'string' },
      price_usd:     { type: 'number', minimum: 0 },
      in_stock:      { type: 'boolean' },
      features:      { type: 'array', items: { type: 'string' } },
      rating:        { type: 'number', minimum: 0, maximum: 5 },
      tags:          { type: 'array', items: { type: 'string' } },
    },
    required: ['name', 'category', 'price_usd', 'in_stock', 'features'],
    additionalProperties: false,
  },

  summary: {
    type: 'object',
    properties: {
      title:       { type: 'string', description: 'Short descriptive title' },
      summary:     { type: 'string', description: '2-3 sentence summary' },
      key_points:  { type: 'array', items: { type: 'string' }, description: 'Main bullet points' },
      tone:        { type: 'string', enum: ['formal', 'informal', 'technical', 'casual'] },
      word_count:  { type: 'integer', description: 'Estimated word count of original' },
    },
    required: ['title', 'summary', 'key_points', 'tone'],
    additionalProperties: false,
  },
};

// ── Exported: current schema object ──────────────────────────
let _currentSchema = null;

export function getSchema() {
  return _currentSchema;
}

// ── Init ─────────────────────────────────────────────────────
export function initSchema() {
  _bindTemplateSelect();
  _bindSchemaEditor();
  _bindCopyBtn();
  _setDefaultSchema();
}

function _setDefaultSchema() {
  const editor = document.getElementById('schema-editor');
  const schema = TEMPLATES.basic;
  editor.value  = JSON.stringify(schema, null, 2);
  _currentSchema = schema;
}

// ── Template Selector ─────────────────────────────────────────
function _bindTemplateSelect() {
  const sel = document.getElementById('schema-template-select');
  sel.addEventListener('change', () => {
    const key = sel.value;
    if (!key || !TEMPLATES[key]) return;
    const editor = document.getElementById('schema-editor');
    editor.value = JSON.stringify(TEMPLATES[key], null, 2);
    _currentSchema = TEMPLATES[key];
    _clearSchemaError();
    sel.value = '';
  });
}

// ── Schema Editor ─────────────────────────────────────────────
function _bindSchemaEditor() {
  const editor = document.getElementById('schema-editor');
  editor.addEventListener('input', _debounce(_validateSchema, 500));
}

function _validateSchema() {
  const editor = document.getElementById('schema-editor');
  const raw    = editor.value.trim();

  if (!raw) {
    _currentSchema = null;
    _clearSchemaError();
    return;
  }

  try {
    _currentSchema = JSON.parse(raw);
    _clearSchemaError();
  } catch (err) {
    _currentSchema = null;
    _showSchemaError(`Invalid JSON: ${err.message}`);
  }
}

function _showSchemaError(msg) {
  const el = document.getElementById('schema-error');
  el.textContent = msg;
  el.removeAttribute('hidden');
}

function _clearSchemaError() {
  const el = document.getElementById('schema-error');
  el.setAttribute('hidden', '');
}

// ── JSON Response Viewer ───────────────────────────────────────
export function renderJsonResponse(jsonString) {
  const output = document.getElementById('json-output');
  try {
    const parsed   = JSON.parse(jsonString);
    const pretty   = JSON.stringify(parsed, null, 2);
    output.innerHTML = _highlight(pretty);
  } catch {
    // Show raw if not valid JSON
    output.innerHTML = `<span class="json-string">${_escape(jsonString)}</span>`;
  }
}

export function clearJsonResponse() {
  const output = document.getElementById('json-output');
  output.innerHTML = '<span class="json-empty">Awaiting response…</span>';
}

// ── Copy Button ───────────────────────────────────────────────
function _bindCopyBtn() {
  const btn = document.getElementById('copy-json-btn');
  btn.addEventListener('click', async () => {
    const output = document.getElementById('json-output');
    const text   = output.textContent.replace(/Awaiting response…/, '').trim();
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.innerHTML = `<svg class="icon" viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="1.5"/></svg> Copy`; }, 2000);
    } catch {
      btn.textContent = 'Failed';
      setTimeout(() => { btn.innerHTML = 'Copy'; }, 2000);
    }
  });
}

// ── JSON Syntax Highlighter ───────────────────────────────────
function _highlight(json) {
  return json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      match => {
        let cls = 'json-number';
        if (/^"/.test(match)) {
          cls = /:$/.test(match) ? 'json-key' : 'json-string';
        } else if (/true|false/.test(match)) {
          cls = 'json-bool';
        } else if (/null/.test(match)) {
          cls = 'json-null';
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );
}

function _escape(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function _debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
