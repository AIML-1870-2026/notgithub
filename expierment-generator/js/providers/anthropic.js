/**
 * providers/anthropic.js — Anthropic Messages API
 *
 * Anthropic blocks direct browser requests (CORS). This module routes through
 * a local proxy at localhost:3001. Run server.js before using this provider.
 *
 * Proxy: POST http://localhost:3001/v1/messages
 */

const PROXY_URL   = 'http://localhost:3001/v1/messages';
const DIRECT_URL  = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';

export class CorsError extends Error {
  constructor() {
    super(
      "Anthropic's API blocks direct browser requests (CORS).\n\n" +
      'To use Claude, start the included proxy:\n' +
      '  npm install express cors\n' +
      '  node server.js\n\n' +
      'Then retry.'
    );
    this.name = 'CorsError';
  }
}

/**
 * Send a message to Anthropic (via local proxy).
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
    model,
    max_tokens: maxTokens,
    temperature,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
    stream: !schema,
  };

  if (systemPrompt?.trim()) body.system = systemPrompt.trim();

  if (schema) {
    body.tools = [{
      name: 'structured_output',
      description: 'Return data matching the provided JSON schema.',
      input_schema: schema,
    }];
    body.tool_choice = { type: 'tool', name: 'structured_output' };
    body.stream = false;
  }

  // Detect proxy availability
  let url = PROXY_URL;
  try {
    const probe = await fetch(PROXY_URL.replace('/v1/messages', '/health'), {
      method: 'GET',
      signal: AbortSignal.timeout(1000),
    });
    if (!probe.ok) url = DIRECT_URL;
  } catch {
    url = DIRECT_URL;
  }

  const headers = {
    'Content-Type':      'application/json',
    'x-api-key':         apiKey,
    'anthropic-version': API_VERSION,
  };
  if (url === DIRECT_URL) headers['anthropic-dangerous-direct-browser-access'] = 'true';

  let res;
  try {
    res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  } catch (err) {
    if (err.name === 'TypeError' || err.message?.includes('Failed to fetch')) throw new CorsError();
    throw err;
  }

  if (!res.ok) throw new Error(await _parseError(res));

  if (schema) {
    const data   = await res.json();
    const toolUse = data.content?.find(b => b.type === 'tool_use');
    yield JSON.stringify(toolUse?.input ?? data, null, 2);
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
      try {
        const evt = JSON.parse(raw);
        if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
          yield evt.delta.text;
        }
      } catch { /* skip */ }
    }
  }
}

async function _parseError(res) {
  try {
    const body = await res.json();
    return body?.error?.message || `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}
