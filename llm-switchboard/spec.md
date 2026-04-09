# LLM Switchboard

A professional, Apple-quality single-page web app for interacting with multiple large language model providers through their APIs. Supports real-time streaming chat and structured JSON output mode.

## Live URL
https://aiml-1870-2026.github.io/notgithub/llm-switchboard/

## Providers Supported
- **OpenAI** — GPT-4o, GPT-4o mini, GPT-4 Turbo, GPT-3.5 Turbo
- **Anthropic** — Claude Opus 4.6, Claude Sonnet 4.6, Claude Haiku 4.5 (via local proxy due to CORS)
- **Google Gemini** — Gemini 2.0 Flash, Gemini 1.5 Pro, Gemini 1.5 Flash

## Features

### Provider Switching
- Three-button provider grid in the sidebar with color-coded active states
- Per-provider model dropdown that updates on selection
- Per-provider API key storage in memory (never persisted to disk or localStorage)
- Basic key format validation with visual feedback (sk- prefix for OpenAI, sk-ant- for Anthropic)

### Chat Mode
- Streaming responses displayed token-by-token with a blinking cursor
- Full conversation history maintained per session
- User and assistant message bubbles with timestamps and provider badges
- Avatar initials reflect the active provider
- Auto-scrolls to latest message
- Welcome screen shown until first message is sent

### Structured JSON Mode
- Schema editor panel with Monaco-style monospace textarea
- Five built-in schema templates loadable via dropdown:
  - **Basic** — answer + confidence score
  - **Person Profile** — name, age, occupation, skills, location
  - **Sentiment Analysis** — sentiment label, score, emotions, key phrases, reasoning
  - **Product Listing** — name, category, price, stock status, features, rating
  - **Document Summary** — title, summary, key points, tone, word count
- Real-time JSON validation with inline error display (500ms debounce)
- Syntax-highlighted JSON response viewer (strings, numbers, booleans, nulls, keys each colored distinctly)
- One-click copy button for the response JSON
- Provider-specific structured output implementations:
  - OpenAI: `response_format.json_schema` with strict mode
  - Anthropic: tool use with `input_schema`
  - Gemini: `responseMimeType: application/json` with `responseSchema`

### Parameters
- **Temperature** slider (0–2, step 0.05) with live numeric readout
- **Max Tokens** slider (256–8192, step 256) with live numeric readout
- Sliders show gradient fill proportional to current value

### System Prompt
- Collapsible section in sidebar
- Free-text textarea passed as system message to all providers

### Anthropic CORS Handling
- Detects whether the optional local proxy (`server.js`) is running on `localhost:3001`
- Falls back gracefully to direct API call if proxy is unavailable
- Dismissible banner explains the limitation and provides setup instructions
- `server.js` is an Express proxy included in the project for local use

### Theme
- Dark mode by default (black/near-black backgrounds, `#0a84ff` accent)
- Light mode toggle (iOS gray palette, `#007aff` accent)
- Preference persisted to `localStorage`
- Smooth CSS variable transitions across all surfaces

### Input
- Auto-resizing textarea (up to 180px tall)
- Send on Enter, Shift+Enter for newline
- Send button disabled while loading or input is empty
- Loading spinner replaces send icon during API calls
- Character count and message count displayed below input
- Clear conversation button resets both chat and JSON panels

## Design System
- **Font**: `-apple-system, BlinkMacSystemFont, SF Pro Text` — native Apple stack, no web font dependency
- **Mono Font**: `SF Mono, Fira Code, Cascadia Code, Consolas` for schema editor and JSON viewer
- **Layout**: Fixed 52px header + sidebar/main two-column grid; sidebar fixed at 260px
- **Dark surfaces**: `#000000` page, `#0a0a0a` secondary, `#1c1c1e` cards, `#2c2c2e` interactive
- **Light surfaces**: `#f2f2f7` page, `#ffffff` cards — mirrors iOS Settings app
- **Provider colors**: OpenAI `#10a37f`, Anthropic `#d4793a`, Gemini `#4285f4`
- **Border radius**: 4px–20px scale; pill (`999px`) for buttons and badges
- **Animations**: `msgIn` keyframe on new messages; spring easing on send button; mode pill slides on segmented control
- **Segmented control**: Animated sliding pill for Chat / Structured JSON toggle
- **Scrollbar**: Thin (6px), transparent track, subtle thumb — consistent across all scroll regions

## File Structure
```
llm-switchboard/
├── index.html              — Semantic HTML structure
├── styles.css              — Full design system and component styles
├── server.js               — Optional Express proxy for Anthropic CORS
├── spec.md                 — This file
└── js/
    ├── app.js              — Entry point; wires modules, handles send flow
    ├── state.js            — Shared state singleton
    ├── theme.js            — Dark/light mode with localStorage
    ├── settings.js         — Sidebar UI bindings
    ├── chat.js             — Message rendering and streaming UI
    ├── schema.js           — Schema editor, templates, JSON viewer
    └── providers/
        ├── openai.js       — OpenAI streaming + structured output
        ├── anthropic.js    — Anthropic streaming + tool-use structured output
        └── gemini.js       — Gemini streaming + responseSchema output
```

## API Keys
Keys are entered in the sidebar and stored in memory only for the duration of the session. They are never written to localStorage, cookies, or any persistent storage. Each provider has its own key field that persists while the tab is open.
