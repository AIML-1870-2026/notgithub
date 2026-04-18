# Blackjack AI Agent — Project Specification

**Course:** AIML 1870 — Spring 2026  
**Assignment:** AI Agent Blackjack Quest  
**Live URL:** https://aiml-1870-2026.github.io/notgithub/blackjack-agent/

---

## Overview

A fully browser-based Blackjack AI Agent that reads live game state, calls a large language model (Claude or OpenAI) via a structured JSON prompt, receives a decision recommendation, and executes that decision — either automatically or step-by-step at the user's pace. No server or build step required; all logic runs in vanilla ES6 modules.

---

## Core Requirements

| Requirement | Implementation |
|---|---|
| Agent reads game state | `agent.js → buildPrompt()` serializes player hand, dealer up-card, available actions, shoe count, and risk profile into the LLM prompt |
| Agent calls an LLM | `callClaude()` uses `claude-sonnet-4-6`; `callOpenAI()` uses `gpt-4o-mini`; both via `fetch()` |
| Structured JSON output | Prompt includes a strict JSON schema; response parsed with fallback regex extraction |
| Agent executes the move | `executeDecision()` in `main.js` calls `hit()`, `stand()`, `doubleDown()`, or `split()` from `player.js` |
| Auto mode | Agent decides and executes without user input; new hands deal automatically |
| Step mode | Agent displays recommendation; user clicks **Execute** to apply each action |
| API key handling | Paste directly into header field or drag-and-drop a `.env` file; key persists in `localStorage` |

---

## Stretch Challenges

### #1 — Strategy Visualization (`strategyMatrix.js`)
A full 10×13 basic strategy grid rendered in the left panel. The cell corresponding to the current player hand vs. dealer up-card is highlighted in gold with a pulsing border each hand. Color coding: Hit = blue, Stand = green, Double = amber, Split = purple.

### #2 — Performance Analytics (`analytics.js`)
A persistent bottom bar tracks win rate, net P/L, hands played, and AI vs. basic strategy agreement percentage. A live SVG sparkline shows the last 20 bankroll values. Clicking the bar (or the ↗ button) opens a full analytics modal with a bankroll history chart. All data persists in `localStorage` and survives page reloads.

### #3 — Explainability Controls
Three depth levels selectable in the right panel:
- **Basic** — action name only
- **Statistical** — action + win probability and statistical basis from the LLM
- **In-depth** — full reasoning paragraph with detailed analysis

The active level is injected into the LLM prompt schema so the model returns the appropriate fields.

### #4 — Risk Tolerance (`riskProfile` in `gameState.js`)
Three profiles injected as instructions into every LLM prompt:
- **Conservative** — prefer standing, minimize bust risk, avoid aggressive doubles
- **Balanced** — standard basic strategy expected value
- **Aggressive** — exploit doubles and splits, maximize EV, count-aware deviations

Switching profiles mid-hand in Step mode immediately re-queries the agent with the new profile.

---

## Architecture

```
index.html          Single-page entry point, no framework
css/style.css       All styling — dark navy design tokens, 3-column grid layout
js/
  config.js         Constants: GAME_PHASE, ACTION, AGENT_MODE, PROVIDER, RISK_PROFILE
  gameState.js      Central pub/sub state store (setState / subscribe pattern)
  deck.js           Shoe and Card classes
  hand.js           Hand class with score calculation (soft/hard Ace handling)
  dealer.js         Dealer turn logic (hit until 17+)
  player.js         Player actions: hit, stand, double, split, insurance
  betting.js        Bet placement and round resolution with payout logic
  strategy.js       Basic strategy lookup tables (Hard / Soft / Pairs)
  cardCount.js      Hi-Lo running count and true count calculation
  stats.js          Per-session result tracking
  animations.js     delay() utility for sequencing async card animations
  sound.js          Sound effect management
  envParser.js      .env file parser and API key loader (localStorage persistence)
  agent.js          LLM integration — prompt builder, provider dispatch, response parser
  analytics.js      Decision quality tracking and sparkline data (localStorage)
  strategyMatrix.js Strategy grid renderer and active-cell highlighter
  ui.js             All DOM rendering — no game logic
  input.js          Event wiring only — delegates to callbacks
  main.js           Round orchestration, agent turn sequencing, auto-deal loop
```

**State flow:** `main.js` calls `setState()` → `gameState.js` notifies all subscribers → `ui.js` re-renders affected DOM. No two-way binding; UI never calls back into state directly.

---

## LLM Integration Details

### Prompt structure
The prompt provides the full game state and requests a strict JSON response:

```
You are a Blackjack AI advisor. Respond ONLY with valid JSON.
Schema: { action, confidence, reasoning, statisticalBasis, riskAssessment, detailedAnalysis }

Player hand: [cards] — Score: X (soft/hard)
Dealer shows: [card]
Available actions: [list]
Risk profile: [conservative | balanced | aggressive]
Hi-Lo true count: [n]  (if card counting enabled)
```

### Provider dispatch
- **Claude:** `POST https://api.anthropic.com/v1/messages` with `x-api-key` header, model `claude-sonnet-4-6`, `max_tokens: 400`
- **OpenAI:** `POST https://api.openai.com/v1/chat/completions` with `Bearer` token, model `gpt-4o-mini`, `max_tokens: 400`

Provider is detected automatically from key prefix: `sk-ant-` → Claude, `sk-` → OpenAI.

### Response parsing
1. `JSON.parse()` the full response text
2. If that fails, regex extract the first `{ ... }` block and parse that
3. Raw response always logged to browser console for debugging

---

## Design Decisions

- **No build step** — ES6 modules loaded directly by the browser; works from `file://` or any static host
- **Non-monolithic JS** — 16 focused modules; no file exceeds ~530 lines
- **Agent never blocks UI** — `isProcessing` flag prevents double-execution; all async chains are guarded
- **Basic strategy comparison** — every agent decision is compared against `strategy.js` lookup and shown as ✓ match or ⚠ deviation
- **Auto-deal loop** — in Auto mode, after resolution the previous bet is re-placed and a new hand deals after a 2.2 s pause, creating a continuous play session
- **Card count defaults on** — Hi-Lo count visible in the info bar and passed to the agent prompt for count-aware recommendations

---

## How to Use

1. Open the live URL (or `index.html` locally via a static server)
2. Paste an API key (`sk-ant-…` for Claude, `sk-…` for OpenAI) into the header field and click **Load**, or drag a `.env` file containing `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` onto the drop zone
3. Select **Auto** or **Step** mode using the toggle in the header
4. Click chips to place a bet, then click **Deal**
5. In Auto mode: watch the agent play. In Step mode: read the recommendation in the right panel, then click **Execute Recommendation**
6. Use the Explanation depth and Risk profile controls to change agent behavior mid-session
7. Click the analytics bar or ↗ to view full session statistics
