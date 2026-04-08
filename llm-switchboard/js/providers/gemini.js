/**
 * providers/gemini.js — Google Gemini API (generativelanguage.googleapis.com)
 * Supports streaming (chat mode) and JSON schema output (structured mode).
 */

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Send a message to Gemini.
 * Streams text chunks in chat mode; returns full JSON string in structured mode.
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
  const contents = _buildContents(messages);

  const body = {
    contents,
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  };

  if (systemPrompt?.trim()) {
    body.systemInstruction = {
      parts: [{ text: systemPrompt.trim() }],
    };
  }

  if (schema) {
    body.generationConfig.responseMimeType = 'application/json';
    body.generationConfig.responseSchema   = _toGeminiSchema(schema);
  }

  const endpoint = schema
    ? `${BASE}/${model}:generateContent?key=${apiKey}`
    : `${BASE}/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await _parseError(res);
    throw new Error(err);
  }

  if (schema) {
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    yield text;
    return;
  }

  // SSE streaming
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
        const parsed = JSON.parse(raw);
        const text   = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) yield text;
      } catch {
        // skip malformed chunks
      }
    }
  }
}

/** Convert standard OpenAPI-style JSON Schema to Gemini's responseSchema format */
function _toGeminiSchema(schema) {
  if (!schema) return undefined;
  // Gemini's schema is mostly compatible with JSON Schema but prefers
  // "OBJECT", "STRING", etc. in UPPER_CASE for "type".
  return _uppercaseTypes(JSON.parse(JSON.stringify(schema)));
}

function _uppercaseTypes(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(_uppercaseTypes);
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k === 'type' && typeof v === 'string') {
      out[k] = v.toUpperCase();
    } else {
      out[k] = _uppercaseTypes(v);
    }
  }
  return out;
}

/** Map OpenAI-style message roles to Gemini's role format */
function _buildContents(messages) {
  return messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
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
