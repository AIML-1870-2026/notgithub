# Science Experiment Generator — Spec

## Overview
A single-page web application that generates customized, grade-appropriate science experiments using AI. Users provide available supplies and configure parameters; the app produces a structured experiment with a safety rating, time estimate, science concept tags, and an interactive materials checklist.

## Problem Statement
K-12 educators and students often lack access to specialized equipment or pre-designed experiments that match their exact supplies and curriculum level. This tool democratizes hands-on STEM learning by generating tailored experiments from whatever materials are on hand.

## Tech Stack
- **HTML / CSS / JavaScript** (ES modules, no build step)
- **marked.js** (CDN) — Markdown → HTML rendering
- **OpenAI / Anthropic / Gemini** — AI providers via their respective APIs

## File Structure
```
expierment-generator/
├── index.html               # App shell
├── styles.css               # Apple-style design system, dark/light themes
├── server.js                # Optional local proxy for Anthropic CORS
└── js/
    ├── app.js               # Entry point — wires all UI interactions
    ├── theme.js             # Dark / light mode persistence
    ├── markdown.js          # marked.js wrapper
    ├── prompts.js           # Builds system + user prompts from parameters
    ├── analysis.js          # Structured analysis schema, fetch, and render
    └── providers/
        ├── openai.js        # OpenAI Chat Completions (streaming + JSON schema)
        ├── anthropic.js     # Anthropic Messages API (via local proxy)
        └── gemini.js        # Google Gemini (streaming + responseSchema)
```

## UI Layout

### Sidebar (288px, sticky)
| Control | Type | Options |
|---|---|---|
| AI Provider | Tab group | OpenAI · Anthropic · Gemini |
| API Key | Password input | Show/hide toggle, format validation |
| Model | Select | Provider-specific models |
| Subject Area | Select | General Science, Chemistry, Biology, Physics, Earth Science, Computer Science |
| Grade Level | Select | K–2, 3–5, 6–8, 9–12, College |
| Difficulty | Slider 0–100 | Beginner → Advanced |
| Duration | Slider 0–100 | Quick (≤15 min) → Extended (90+ min) |
| Detail Level | Slider 0–100 | Overview → Comprehensive |

### Main Content
1. **Input card** — Supplies textarea (required) + Additional Context (optional)
2. **Generate button** — disabled until API key + supplies are filled
3. **Output section** (hidden until first generation):
   - Streamed experiment text (markdown rendered)
   - Regenerate / Download / Copy action buttons
   - Structured analysis panel (rendered after streaming)

## Generation Flow
1. User fills supplies and clicks "Generate Experiment"
2. App builds system + user prompts via `prompts.js`
3. Provider's `sendMessage` streams experiment text chunk-by-chunk
4. After streaming completes, `fetchAnalysis` makes a second non-streaming call with a JSON schema
5. Analysis panel renders with safety rating, time estimate, concept tags, and materials checklist

## Structured Analysis Schema
```json
{
  "safety_rating":        { "score": 1–10, "summary": "string" },
  "estimated_minutes":    number,
  "science_concepts":     ["string", ...],
  "materials_checklist":  [{ "item": "string", "essential": boolean }, ...]
}
```

## Provider Notes
| Provider | Auth | Streaming | Structured Output |
|---|---|---|---|
| OpenAI | `sk-` Bearer token | SSE | `response_format: json_schema` |
| Anthropic | `sk-ant-` via proxy | Anthropic SSE | Tool use (`input_schema`) |
| Gemini | `AIza` query param | SSE | `responseMimeType: application/json` |

### Anthropic Proxy
Anthropic's API blocks direct browser requests. `server.js` is an Express proxy on `localhost:3001`. The browser pings `/health` to detect if it's running before sending requests.

```bash
npm install express cors
node server.js
```

## Design System
- Font: `system-ui, -apple-system, "SF Pro Display"` (Apple stack)
- Accent: teal `#5ac8fa` (dark) / `#0093c4` (light)
- Theme: dark default, light toggle, persisted in `localStorage`
- Responsive: sidebar stacks above main on screens ≤ 780px

## Prompt Structure
The system prompt instructs the model to output eight markdown sections:
`🔬 Experiment Title`, `🎯 Learning Objectives`, `📚 Background`, `🧪 Materials Needed`, `⚠️ Safety Notes`, `📋 Step-by-Step Procedure`, `💡 What's Happening?`, `🚀 Extensions & Variations`

Difficulty, Duration, and Detail sliders inject natural-language descriptions into the system prompt to steer length and complexity.
