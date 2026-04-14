# Product Review Generator — Specification

## Overview

A single-page web application that generates AI-written product reviews using the OpenAI Chat Completions API. The user provides product details and personality sliders, and the app streams a formatted review in real time, then follows up with a structured sentiment analysis and star rating.

---

## Architecture

| Layer | File(s) | Responsibility |
|---|---|---|
| Markup | `index.html` | Layout, sidebar controls, output section |
| Styles | `styles.css` | CSS custom properties, dark/light themes, component styles |
| Entry point | `js/app.js` | State management, UI event wiring, generation flow |
| API client | `js/openai.js` | OpenAI fetch calls — streaming review + JSON sentiment |
| Theme | `js/theme.js` | Dark/light mode toggle with localStorage persistence |
| Markdown | `js/markdown.js` | Thin wrapper around CDN-loaded marked.js |

All JS is loaded as ES modules (`type="module"`). No build step or bundler required.

---

## Features

### Inputs

| Field | Required | Description |
|---|---|---|
| OpenAI API Key | Yes | Held in memory only; never persisted to storage |
| Product Name | Yes | Short name of the product being reviewed |
| Product Description | Yes | Free-text description of the product |
| Category | No | e.g. Electronics, Clothing, Software |
| Key Features | No | Comma-separated feature highlights |

### Personality Sliders

Five sliders (0–100) control system-prompt instructions sent to the model:

| Slider | Left (0–25) | Mid (26–75) | Right (76–100) |
|---|---|---|---|
| Tone | Professional | Balanced | Casual |
| Length | Concise (150–250 words) | Moderate (300–450 words) | Detailed (500–700 words) |
| Humor | Serious | Neutral | Hilarious |
| Technicality | Layman | General | Expert |
| Enthusiasm | Stoic | Balanced | Hype |

### Model Selection

- **Model Family** dropdown: GPT-4o, GPT-4 Turbo, GPT-3.5
- **Model** dropdown: populated from the selected family
  - GPT-4o → `gpt-4o`, `gpt-4o-mini`
  - GPT-4 Turbo → `gpt-4-turbo`
  - GPT-3.5 → `gpt-3.5-turbo`

### Theme

- Dark mode by default; toggled via a sun/moon header button
- Preference persisted in `localStorage` under key `prg-theme`

---

## Generation Flow

1. User clicks **Generate Review** (enabled only when API key, product name, and description are all filled).
2. `_buildPrompts()` constructs a system prompt encoding all five slider values and a user prompt with product details.
3. `streamReview()` sends a streaming Chat Completions request (`stream: true`, `temperature: 0.7`, `max_tokens: 1500`).
4. Chunks are yielded via an async generator (`_streamSSE`), parsed from SSE `data:` lines, and appended to the output div in real time via `parseMarkdown()`.
5. After streaming completes, `fetchSentiment()` sends a second, non-streaming request using OpenAI's **structured output** (`response_format: json_schema`) at `temperature: 0.3`, `max_tokens: 400`.
6. Sentiment JSON is rendered as three aspect cards (Price/Value, Features, Usability) plus an animated star rating.

---

## API Calls

### Review (streaming)

```
POST https://api.openai.com/v1/chat/completions
Authorization: Bearer <apiKey>
Content-Type: application/json

{
  model, temperature: 0.7, max_tokens: 1500, stream: true,
  messages: [ { role: "system", ... }, { role: "user", ... } ]
}
```

### Sentiment (structured JSON)

```
POST https://api.openai.com/v1/chat/completions
Authorization: Bearer <apiKey>
Content-Type: application/json

{
  model, temperature: 0.3, max_tokens: 400,
  response_format: { type: "json_schema", json_schema: { name: "sentiment_analysis", strict: true, schema: { ... } } },
  messages: [ { role: "system", ... }, { role: "user", ... } ]
}
```

Returned schema:

```json
{
  "price_value": { "score": 1–10, "summary": "string" },
  "features":    { "score": 1–10, "summary": "string" },
  "usability":   { "score": 1–10, "summary": "string" },
  "overall_rating": 1.0–5.0   // 0.5 increments
}
```

---

## Review Output Format

The model is instructed to always use this markdown structure:

```
## Overview
## Pros        (bullet points)
## Cons        (bullet points)
## Verdict
```

Output is rendered to HTML by `marked.parse()` loaded from the JSDelivr CDN.

---

## Output UI Components

| Component | Behavior |
|---|---|
| Review text area | Streams in real time; markdown rendered via marked.js |
| Star rating panel | Animated SVG stars (half-star precision) derived from `overall_rating` |
| Sentiment cards | Three cards (Price/Value, Features, Usability) with score bar and summary |
| Regenerate button | Re-runs generation with the same inputs; hidden during generation |
| Copy button | Copies `innerText` of the review div to clipboard; shows "Copied!" feedback for 2 s |
| Toast notifications | Bottom-center dismissible messages for validation errors |

---

## Security & Privacy

- API key is stored only in the in-memory `state` object; never written to `localStorage`, `sessionStorage`, or cookies.
- All user-provided strings rendered into HTML are passed through `_escapeHtml()` before insertion.
- Marked.js processes only model-generated markdown, not raw user input.
- App includes a sidebar disclaimer: educational use only; AI-generated reviews should not be attributed to real consumers per FTC guidelines.

---

## File Structure

```
product-review-generator/
├── index.html          # Single-page layout
├── styles.css          # All styles (CSS custom properties, dark/light themes)
├── spec.md             # This document
└── js/
    ├── app.js          # Entry point, state, UI wiring, generation orchestration
    ├── openai.js       # OpenAI API client (streaming + JSON structured output)
    ├── theme.js        # Dark/light mode with localStorage persistence
    └── markdown.js     # Wrapper around CDN marked.js
```

---

## Dependencies

| Dependency | Source | Purpose |
|---|---|---|
| marked.js | `https://cdn.jsdelivr.net/npm/marked/marked.min.js` | Markdown → HTML |
| OpenAI API | `https://api.openai.com/v1/chat/completions` | Review generation + sentiment |

No npm packages. No build tooling. Runs directly in a modern browser.
