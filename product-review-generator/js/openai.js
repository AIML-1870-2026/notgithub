/**
 * openai.js — OpenAI Chat Completions API
 * Supports streaming for review text and structured JSON for sentiment analysis.
 */

const API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Stream a product review from OpenAI.
 * Yields text chunks as an async generator.
 *
 * @param {object} opts
 * @param {string} opts.apiKey
 * @param {string} opts.model
 * @param {string} opts.systemPrompt
 * @param {string} opts.userPrompt
 */
export async function* streamReview({ apiKey, model, systemPrompt, userPrompt }) {
  const body = {
    model,
    temperature: 0.7,
    max_tokens: 1500,
    stream: true,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt   },
    ],
  };

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const msg = await _parseError(res);
    throw new Error(msg);
  }

  yield* _streamSSE(res);
}

/**
 * Fetch structured sentiment analysis (non-streaming).
 * Returns { price_value, features, usability } each with { score, summary }.
 *
 * @param {object} opts
 * @param {string} opts.apiKey
 * @param {string} opts.model
 * @param {string} opts.productName
 * @param {string} opts.reviewText  Full review text already generated
 */
export async function fetchSentiment({ apiKey, model, productName, reviewText }) {
  const schema = {
    type: 'object',
    properties: {
      price_value: {
        type: 'object',
        properties: {
          score:   { type: 'number' },
          summary: { type: 'string' },
        },
        required: ['score', 'summary'],
        additionalProperties: false,
      },
      features: {
        type: 'object',
        properties: {
          score:   { type: 'number' },
          summary: { type: 'string' },
        },
        required: ['score', 'summary'],
        additionalProperties: false,
      },
      usability: {
        type: 'object',
        properties: {
          score:   { type: 'number' },
          summary: { type: 'string' },
        },
        required: ['score', 'summary'],
        additionalProperties: false,
      },
    },
    required: ['price_value', 'features', 'usability'],
    additionalProperties: false,
  };

  const body = {
    model,
    temperature: 0.3,
    max_tokens: 400,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'sentiment_analysis',
        schema,
        strict: true,
      },
    },
    messages: [
      {
        role: 'system',
        content: 'You are a product analyst. Given a product review, return a structured sentiment analysis with scores from 1–10 and brief one-sentence summaries for three aspects: price/value, features, and usability.',
      },
      {
        role: 'user',
        content: `Product: ${productName}\n\nReview:\n${reviewText}\n\nAnalyze the sentiment for price/value, features, and usability. Score each 1–10.`,
      },
    ],
  };

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const msg = await _parseError(res);
    throw new Error(msg);
  }

  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

// ── SSE Streaming ─────────────────────────────────────────────

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

// ── Error Parsing ─────────────────────────────────────────────

async function _parseError(res) {
  try {
    const body = await res.json();
    return body?.error?.message || `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}
