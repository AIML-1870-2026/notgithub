/**
 * providers/gemini.js — Google Gemini API
 * Supports streaming (text mode) and JSON schema output (schema mode).
 */

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Send a message to Gemini.
 * Yields text chunks in stream mode; yields JSON string in schema mode.
 *
 * @param {object} opts
 * @param {Array}  opts.messages
 * @param {string} opts.model
 * @param {number} opts.temperature
 * @param {number} opts.maxTokens
 * @param {string} opts.systemPrompt
 * @param {string} opts.apiKey
 * @param {object|null} opts.schema
 */
export async function* sendMessage({ messages, model, temperature, maxTokens, systemPrompt, apiKey, schema }) {
  const body = {
    contents: _buildContents(messages),
    generationConfig: { temperature, maxOutputTokens: maxTokens },
  };

  if (systemPrompt?.trim()) {
    body.systemInstruction = { parts: [{ text: systemPrompt.trim() }] };
  }

  if (schema) {
    body.generationConfig.responseMimeType = 'application/json';
    body.generationConfig.responseSchema   = _toGeminiSchema(schema);
  }

  const endpoint = schema
    ? `${BASE}/${model}:generateContent?key=${apiKey}`
    : `${BASE}/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

  let res;
  try {
    res = await fetch(endpoint, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
  } catch {
    throw new Error('Request failed — check your Gemini API key and network connection.');
  }

  if (!res.ok) throw new Error(await _parseError(res));

  if (schema) {
    const data = await res.json();
    yield data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    return;
  }

  yield* _streamSSE(res);
}

async function* _streamSSE(res) {
  const reader  = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer    = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6).trim();
      if (!raw) continue;
      try {
        const text = JSON.parse(raw).candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) yield text;
      } catch { /* skip malformed */ }
    }
  }
}

/** Recursively uppercase all "type" values for Gemini's schema format */
function _toGeminiSchema(schema) {
  return _uppercaseTypes(JSON.parse(JSON.stringify(schema)));
}

function _uppercaseTypes(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(_uppercaseTypes);
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = (k === 'type' && typeof v === 'string') ? v.toUpperCase() : _uppercaseTypes(v);
  }
  return out;
}

function _buildContents(messages) {
  return messages.map(m => ({
    role:  m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
}

async function _parseError(res) {
  try {
    const body = await res.json();
    return body?.error?.message || `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}
