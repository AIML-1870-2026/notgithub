/**
 * providers/anthropic.js — Anthropic Messages API
 *
 * CORS note: Anthropic's API blocks direct browser requests.
 * This module first attempts to use a local proxy at localhost:3001.
 * If that fails, it throws a CorsError with a helpful message.
 *
 * Proxy endpoint: POST http://localhost:3001/v1/messages
 * (See server.js for the Express proxy implementation)
 */

const PROXY_URL    = 'http://localhost:3001/v1/messages';
const DIRECT_URL   = 'https://api.anthropic.com/v1/messages';
const API_VERSION  = '2023-06-01';

export class CorsError extends Error {
  constructor() {
    super(
      "Anthropic's API blocks direct browser requests due to CORS.\n\n" +
      "To use Claude, run the included server.js proxy:\n" +
      "  npm install express cors\n" +
      "  node server.js\n\n" +
      "Then retry your message."
    );
    this.name = 'CorsError';
  }
}

/**
 * Send a message to Anthropic (via proxy or direct).
 * Streams text chunks in chat mode; returns full JSON in structured mode.
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
    messages: _buildMessages(messages),
    stream: !schema,
  };

  if (systemPrompt?.trim()) {
    body.system = systemPrompt.trim();
  }

  if (schema) {
    // Use tool-use to force structured output
    body.tools = [{
      name: 'structured_output',
      description: 'Return data matching the provided JSON schema.',
      input_schema: schema,
    }];
    body.tool_choice = { type: 'tool', name: 'structured_output' };
    body.stream = false;
  }

  // Try proxy first, fall back to direct (direct will likely CORS-fail)
  let url = PROXY_URL;
  let useProxy = true;
  try {
    // Quick connectivity check to proxy
    const probe = await fetch(PROXY_URL.replace('/v1/messages', '/health'), { method: 'GET', signal: AbortSignal.timeout(1000) });
    useProxy = probe.ok;
  } catch {
    useProxy = false;
    url = DIRECT_URL;
  }

  const headers = {
    'Content-Type':         'application/json',
    'x-api-key':            apiKey,
    'anthropic-version':    API_VERSION,
  };

  // When going direct (will likely fail with CORS), add the CORS flag
  if (!useProxy) {
    headers['anthropic-dangerous-direct-browser-access'] = 'true';
  }

  let res;
  try {
    res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  } catch (err) {
    if (err.name === 'TypeError' || err.message?.includes('CORS') || err.message?.includes('Failed to fetch')) {
      throw new CorsError();
    }
    throw err;
  }

  if (!res.ok) {
    const errMsg = await _parseError(res);
    throw new Error(errMsg);
  }

  if (schema) {
    const data = await res.json();
    // Extract tool use input
    const toolUse = data.content?.find(b => b.type === 'tool_use');
    if (toolUse?.input) {
      yield JSON.stringify(toolUse.input, null, 2);
    } else {
      yield JSON.stringify(data, null, 2);
    }
    return;
  }

  // Anthropic SSE streaming
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
      if (line.startsWith('data: ')) {
        const raw = line.slice(6).trim();
        try {
          const evt = JSON.parse(raw);
          if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
            yield evt.delta.text;
          }
        } catch {
          // skip
        }
      }
    }
  }
}

function _buildMessages(history) {
  return history.map(m => ({ role: m.role, content: m.content }));
}

async function _parseError(res) {
  try {
    const body = await res.json();
    return body?.error?.message || `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}
