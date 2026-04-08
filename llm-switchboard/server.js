/**
 * server.js — Optional local proxy for Anthropic's API
 *
 * Anthropic's API blocks direct browser requests (CORS).
 * Run this proxy locally to use Claude in the LLM Switchboard.
 *
 * Setup:
 *   npm install express cors node-fetch
 *   node server.js
 *
 * The proxy listens on http://localhost:3001
 */

const express = require('express');
const cors    = require('cors');

const app  = express();
const PORT = 3001;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '4mb' }));

// Health check (used by the browser to detect if proxy is running)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'llm-switchboard-proxy' });
});

// Anthropic proxy
app.post('/v1/messages', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({ error: { message: 'Missing x-api-key header' } });
  }

  const isStream = req.body?.stream === true;

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': req.headers['anthropic-version'] || '2023-06-01',
      },
      body: JSON.stringify(req.body),
    });

    if (isStream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      upstream.body.pipeTo(new WritableStream({
        write(chunk) { res.write(chunk); },
        close()      { res.end(); },
      }));
    } else {
      const data = await upstream.json();
      res.status(upstream.status).json(data);
    }
  } catch (err) {
    console.error('[proxy error]', err);
    res.status(502).json({ error: { message: `Proxy error: ${err.message}` } });
  }
});

app.listen(PORT, () => {
  console.log(`LLM Switchboard proxy running at http://localhost:${PORT}`);
  console.log('Health check: http://localhost:3001/health');
});
