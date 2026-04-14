/**
 * providers/openai.js — OpenAI Chat Completions API
 * Supports streaming (text mode) and structured JSON output (schema mode).
 */

const API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Send a message to OpenAI.
 * Yields text chunks in stream mode; yields full JSON string in schema mode.
 *
 * @param {object} opts
 * @param {Array}  opts.messages      [{ role, content }, ...]
 * @param {string} opts.model
 * @param {number} opts.temperature
 * @param {number} opts.maxTokens
 * @param {string} opts.systemPrompt
 * @param {string} opts.apiKey
 * @param {object|null} opts.schema   JSON Schema for structured output; null for streaming
 */
export async function* sendMessage({ messages, model, temperature, maxTokens, systemPrompt, apiKey, schema }) {
  const body = {
    model,
    temperature,
    max_tokens: maxTokens,
    messages: _buildMessages(messages, systemPrompt),
  };

  if (schema) {
    body.response_format = {
      type: 'json_schema',
      json_schema: { name: 'structured_response', schema, strict: true },
    };
  } else {
    body.stream = true;
  }

  let res;
  try {
    res = await fetch(API_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body:    JSON.stringify(body),
    });
  } catch {
    throw new Error('Request blocked — check your API key and network connection.');
  }

  if (!res.ok) {
    throw new Error(await _parseError(res));
  }

  if (schema) {
    const data = await res.json();
    yield data.choices[0].message.content;
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
      if (raw === '[DONE]') return;
      try {
        const delta = JSON.parse(raw).choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch { /* skip malformed chunk */ }
    }
  }
}

function _buildMessages(history, systemPrompt) {
  const msgs = [];
  if (systemPrompt?.trim()) msgs.push({ role: 'system', content: systemPrompt.trim() });
  return msgs.concat(history);
}

async function _parseError(res) {
  try {
    const body = await res.json();
    return body?.error?.message || `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}
