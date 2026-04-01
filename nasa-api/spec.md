# NEOWatch — Project Specification

## Overview

NEOWatch is an interactive browser-based dashboard for tracking and visualizing Near-Earth Objects (NEOs). It pulls live data from NASA and JPL APIs and presents it across five purpose-built visualizations, each designed to make a different facet of asteroid data immediately readable and engaging.

---

## Live Demo

**[https://aiml-1870-2026.github.io/notgithub/nasa-api/](https://aiml-1870-2026.github.io/notgithub/nasa-api/)**

---

## Data Sources

| API | Provider | Requires Key | Purpose |
|---|---|---|---|
| [NeoWs Feed](https://api.nasa.gov/neo/rest/v1/feed) | NASA | Yes (free) | 7-day close approach objects |
| [SBDB Close-Approach Data (CAD)](https://ssd-api.jpl.nasa.gov/cad.api) | JPL | No | Historical close approaches |
| [Sentry Impact Risk](https://ssd-api.jpl.nasa.gov/sentry.api) | JPL | No | Long-term impact probability rankings |

JPL endpoints do not include CORS headers, so requests are routed through [corsproxy.io](https://corsproxy.io).

To use your own NASA API key, replace the value in `js/config.js`:

```js
NASA_API_KEY: 'YOUR_KEY_HERE',
```

Register for a free key at [https://api.nasa.gov](https://api.nasa.gov).

---

## Tech Stack

| Library | Version | Role |
|---|---|---|
| [Three.js](https://threejs.org) | 0.128.0 | 3D rendering engine (must be this exact version) |
| [Globe.gl](https://globe.gl) | 2.45.1 | Three.js Earth globe wrapper |
| [D3.js](https://d3js.org) | 7 | All 2D chart visualizations |
| Vanilla JS (ES Modules) | — | Application logic, no framework |

---

## File Structure

```
nasa-api/
├── index.html          # HTML shell, tab navigation, CDN script tags
├── style.css           # Dark space theme, layout, D3 visualization styles
└── js/
    ├── app.js          # Entry point — wires events, bootstraps data fetching
    ├── config.js       # API keys, endpoints, shared constants
    ├── state.js        # Centralized application state object
    ├── api.js          # Fetch wrappers and data transformers for all 3 APIs
    ├── globe.js        # Globe.gl initialization and Three.js asteroid rendering
    ├── router.js       # Tab switching and lazy-load logic
    ├── utils.js        # Formatting helpers, toast notifications, skeleton loaders
    └── tabs/
        ├── today.js    # D3 orbital proximity diagram (7-day approaches)
        ├── hazard.js   # D3 bubble chart (Sentry impact rankings)
        ├── history.js  # D3 scatter plot (historical close approaches)
        └── size.js     # D3 proportional circles (size comparisons)
```

---

## Tabs & Visualizations

### 1. 3D Earth (`globe.js`)

**Data:** NeoWs 7-day feed  
**Library:** Globe.gl + Three.js

An interactive 3D Earth globe. Each asteroid is rendered as a free-floating Three.js sphere mesh positioned in 3D space using `customLayerData`. Distance from Earth's surface encodes the asteroid's real miss distance (logarithmically scaled). Hazardous objects are red with a translucent glow halo; safe objects are cyan.

- Auto-rotating; pauses on hover
- Click any dot to open a details panel (name, distance, velocity, diameter, JPL link)
- Globe radius: 100 Three.js world units; sphere radii sized accordingly (1.8–2.5 units)
- Asteroid lat/lng seeded deterministically from object ID using the golden angle distribution across the ±23.5° ecliptic band

**Key constants:**
```js
MOON_ORBIT_AU: 0.00257     // 1 lunar distance
altitude = 0.25 + Math.log10(distAU / MOON_ORBIT_AU + 1) * 0.75
```

---

### 2. Today's Approaches (`tabs/today.js`)

**Data:** NeoWs 7-day feed  
**Library:** D3 v7

A D3 SVG orbital proximity diagram. Earth sits at the center; concentric dashed rings mark distances at 1, 5, 10, 20, and 40 Lunar Distances. Each asteroid is plotted as a dot at its actual miss distance, distributed evenly around Earth by angle (sorted by close-approach date). Dot radius scales with estimated diameter (clamped 4–14px). Hazardous objects show a pulse ring.

- Filter: hazardous only toggle
- Sort: date, distance, size, velocity (re-renders diagram)
- Hover tooltip: name, date, distance, speed, diameter
- Labels shown for objects within 10 LD

**Scale:** `d3.scaleLog([0.3, 50], [earthRadius+12, maxRadius])`

---

### 3. Hazard Rankings (`tabs/hazard.js`)

**Data:** JPL Sentry API  
**Library:** D3 v7

Left panel: ranked list of up to 20 Sentry-monitored objects showing full name, impact window, scenario count, cumulative Palermo Scale score, and Torino Scale badge.

Right panel: D3 bubble/scatter chart.
- **X-axis:** Cumulative Palermo Scale (more negative = lower risk)
- **Y-axis:** Impact probability (log scale)
- **Bubble size:** `√(nImpacts)` — more impact scenarios = larger bubble
- **Color:** red if PS > −2 (noteworthy), cyan if PS ≤ −2 (below background)
- Dashed red reference line at PS = −2
- Hover tooltip: full name, PS value, probability, impact window, scenario count

---

### 4. Historical Timeline (`tabs/history.js`)

**Data:** JPL SBDB Close-Approach Data API (objects within 0.05 AU)  
**Library:** D3 v7

A D3 scatter plot of historical close approaches.
- **X-axis:** Close approach date (D3 time scale; re-renders with correct dimensions when tab becomes visible)
- **Y-axis:** Miss distance in Lunar Distances (log scale, inverted — closer = higher)
- **Dot color:** Bright cyan (very close, < 1 LD) → dim grey (far), using `d3.scaleSequentialLog`
- Reference lines at 1 LD (Moon orbit) and 5 LD
- Hover tooltip: designation, date, distance in LD and km, velocity, absolute magnitude

Supports search by designation, date range filtering, and pagination (30 results/page). Re-renders on every tab switch to pick up correct container dimensions.

**Date parsing note:** JPL CAD dates use the format `"2026-Mar-25 02:07"` (3-letter month abbreviation). These are parsed manually using a month-name lookup table since this format is not valid ISO 8601 and `new Date()` would return `Invalid Date`.

---

### 5. Size Comparisons (`tabs/size.js`)

**Data:** NeoWs 7-day feed  
**Library:** D3 v7

A D3 SVG circle comparison. Each object is drawn as a filled circle where **area is proportional to real cross-section** (radius ∝ √diameter). Objects are arranged on a shared horizontal baseline, sorted smallest to largest.

- The selected asteroid gets a colored glow ring (red = hazardous, cyan = safe)
- Reference objects span from an adult human (1.8 m) to Manhattan Island (21,600 m)
- Only references within 3 orders of magnitude of the selected asteroid are shown
- Selector dropdown allows switching between all asteroids in the 7-day window
- Hover tooltip: name, exact diameter

---

## State Management

All application state lives in a single `STATE` object (`js/state.js`):

```js
STATE = {
  activeTab: 'globe',
  data: {
    todayNeos:    [],   // transformed NeoWs objects
    hazardNeos:   [],   // transformed Sentry objects
    historyNeos:  [],   // transformed CAD objects (current page)
    historyTotal: 0,    // total CAD result count (for pagination)
  },
  loaded: {
    today:   false,
    hazard:  false,
    history: false,
  },
  ui: {
    todayFilter:    { hazardousOnly: false, sortBy: 'date' },
    historyPage:    0,
    historySearch:  '',
    historyDateMin: '',
    historyDateMax: '',
    globeInstance:  null,   // Globe.gl instance
    selectedNeo:    null,   // currently selected asteroid on globe
  }
}
```

---

## Data Flow

```
DOMContentLoaded
  └── init() [app.js]
        ├── wireEvents()         — attach all UI event listeners
        ├── initGlobe()          — create Globe.gl instance
        └── Promise.allSettled([fetchNeoFeed(), fetchSentry(), fetchCAD(0)])
              ├── fetchNeoFeed() → STATE.data.todayNeos  → renderTodayTab(), updateGlobePoints()
              ├── fetchSentry()  → STATE.data.hazardNeos → renderHazardTab()
              └── fetchCAD(0)   → STATE.data.historyNeos → renderHistoryTab()

Tab switch [router.js]
  ├── globe   → updateGlobePoints() if data ready
  ├── today   → loadTodayData() or renderTodayTab()
  ├── hazard  → loadHazardData() or renderHazardTab()
  ├── history → loadHistoryData() or renderHistoryTab()  ← always re-renders for correct dimensions
  └── size    → populateSizeSelector() or renderSizeTab()
```

---

## Configuration Reference (`js/config.js`)

| Key | Default | Description |
|---|---|---|
| `NASA_API_KEY` | *(your key)* | NASA Open APIs key |
| `MOON_ORBIT_AU` | `0.00257` | 1 lunar distance in AU |
| `CAD_DIST_MAX` | `'0.05'` | Max miss distance for historical data (AU) |
| `CAD_PAGE_SIZE` | `30` | Results per page in the history tab |
| `SENTRY_CHART_LIMIT` | `20` | Max objects shown in hazard chart |
| `HAZARD_COLOR` | `#ff4757` | Color for potentially hazardous objects |
| `SAFE_COLOR` | `#00d4ff` | Color for safe objects |
| `GLOBE_ATMOSPHERE` | `#00d4ff` | Globe atmosphere glow color |

---

## Running Locally

This is a pure client-side application — no build step required. Serve it with any static file server:

```bash
# Python
python3 -m http.server 8000

# Node
npx serve .
```

Then open `http://localhost:8000/nasa-api/` in your browser.

> **Note:** Opening `index.html` directly as a `file://` URL will fail due to ES module CORS restrictions. A local server is required.