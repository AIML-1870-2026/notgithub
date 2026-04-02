# Drug Safety Explorer

An interactive, single-page browser tool for exploring FDA drug safety data using the OpenFDA public API. No API key required. Fully static — deployed to GitHub Pages.

## Live URL

https://aiml-1870-2026.github.io/notgithub/drug-safety/

## Features

### Tab 1 — Drug Search & Adverse Events
- Search any brand or generic drug name
- Displays top 10 adverse reactions as a horizontal bar chart (Chart.js)
- Summary stat cards: total FAERS reports, recall record count, label warnings
- Live autocomplete suggestions from FDA NDC database
- Example drug quick-search pills

### Tab 2 — Side-by-Side Comparison
- Compare two drugs simultaneously
- D3 grouped horizontal bar chart showing shared and unique adverse reactions
- Preset example pairs (Warfarin vs Ibuprofen, SSRI comparisons)

### Tab 3 — Recall Timeline
- D3 swim-lane timeline of FDA enforcement actions
- Color-coded by recall class (I=Red, II=Orange, III=Green)
- Hover tooltips with product, reason, status, and recalling firm
- Collision jitter for events on the same date

### Tab 4 — Drug Class Explorer
- Browse aggregated safety profiles for: SSRIs, Statins, ACE Inhibitors, NSAIDs, Beta Blockers
- Uses FDA Established Pharmacologic Class (EPC) for authoritative aggregation
- Shows which drugs are included in the analysis

### Contextual Help
- Info (?) buttons throughout explain FAERS limitations, adverse events, recall classifications, and label warnings in plain language

---

## Data Sources

| Endpoint | Used For |
|---|---|
| `https://api.fda.gov/drug/event.json` | Adverse Event Reporting System (FAERS) |
| `https://api.fda.gov/drug/enforcement.json` | Recalls and enforcement actions |
| `https://api.fda.gov/drug/label.json` | Drug label warnings |
| `https://api.fda.gov/drug/ndc.json` | Autocomplete drug name suggestions |

All endpoints are free, public, and require no API key.

---

## Disclaimer

Data sourced from the FDA OpenFDA API. Adverse event reports are voluntarily submitted to FAERS and **do not establish a causal relationship** between any drug and any reported adverse event. Report counts are not adjusted for market share or prescription volume. This tool is for **educational purposes only** and is not intended to inform medical decisions.

---

## Technical Stack

- **HTML/CSS/JS** — Vanilla, no build tools, static deployment
- **Chart.js v4** (CDN) — Horizontal bar charts (adverse events, drug classes)
- **D3.js v7** (CDN) — Swim-lane recall timeline, grouped comparison chart
- **ES Modules** — Fully modular JS architecture (no monolithic files)

## File Structure

```
drug-safety/
├── index.html               Entry point
├── spec.md                  This file
├── css/
│   ├── style.css            Design tokens, layout, base reset
│   ├── components.css       Cards, inputs, modals, badges
│   └── animations.css       Keyframes, skeletons, transitions
└── js/
    ├── main.js              App entry, tab router, event wiring
    ├── config.js            API constants, drug class definitions, help text
    ├── state.js             Centralized mutable state object
    ├── api.js               All OpenFDA fetch wrappers + data transforms
    ├── autocomplete.js      Debounced typeahead search
    ├── ui.js                Toast, skeleton, help modal utilities
    ├── views/
    │   ├── search.js        Tab 1 — drug search view
    │   ├── compare.js       Tab 2 — comparison view
    │   ├── timeline.js      Tab 3 — recall timeline view
    │   └── classes.js       Tab 4 — drug class explorer view
    └── charts/
        ├── adverseBar.js    Chart.js horizontal bar (pure wrapper)
        ├── recallTimeline.js D3 swim-lane timeline (pure wrapper)
        └── compareChart.js  D3 grouped bar comparison (pure wrapper)
```

---

## Assignment Requirements Met

- [x] Queries ≥1 OpenFDA endpoint with live API calls (queries 4 endpoints)
- [x] Single-page HTML/CSS/JS application
- [x] Deployable to GitHub Pages (fully static)
- [x] Educational disclaimer included
- [x] FDA attribution statement in footer
- [x] Stretch: Autocomplete search (NDC endpoint)
- [x] Stretch: Contextual help popups with plain-language explanations
- [x] Stretch: Visual storytelling via timeline + comparison charts
- [x] Stretch: Drug class exploration (SSRIs, Statins, ACE Inhibitors, NSAIDs, Beta Blockers)
