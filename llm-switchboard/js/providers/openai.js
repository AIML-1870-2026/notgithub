/**
 * providers/openai.js — OpenAI Chat Completions API
 * Supports streaming (chat mode) and structured JSON output (structured mode).
 */

const API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Send a message to OpenAI.
 * In chat mode: yields text chunks as an async generator (streaming).
 * In structured mode: yields the full JSON string in one shot.
 *
 * @param {object} opts
 * @param {Array}  opts.messages     Conversation history
 * @param {string} opts.model
 * @param {number} opts.temperature
 * @param {number} opts.maxTokens
 * @param {string} opts.systemPrompt
 * @param {string} opts.apiKey
 * @param {object|null} opts.schema  JSON Schema object for structured mode
 */
export async function* sendMessage({ messages, model, temperature, maxTokens, systemPrompt, apiKey, schema }) {
  const body = {
    model,
    temperature,
    max_tokens: maxTokens,
    messages: _buildMessages(messages, systemPrompt),
  };

  if (schema) {
    // Structured output — no streaming
    body.response_format = {
      type: 'json_schema',
      json_schema: {
        name: 'structured_response',
        schema,
        strict: true,
      },
    };
  } else {
    body.stream = true;
  }

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await _parseError(res);
    throw new Error(err);
  }

  if (schema) {
    const data = await res.json();
    yield data.choices[0].message.content;
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
    buffer = lines.pop(); // keep incomplete line

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6).trim();
      if (raw === '[DONE]') return;

      try {
        const parsed = JSON.parse(raw);
        const delta  = parsed.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch {
        // malformed chunk — skip
      }
    }
  }
}

function _buildMessages(history, systemPrompt) {
  const msgs = [];
  if (systemPrompt?.trim()) {
    msgs.push({ role: 'system', content: systemPrompt.trim() });
  }
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
