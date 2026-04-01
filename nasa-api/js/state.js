/* ══════════════════════════════════════════════════════
   state.js — Centralized application state
   All modules import this single object and mutate it directly.
══════════════════════════════════════════════════════ */

export const STATE = {
  activeTab: 'globe',

  // Transformed data arrays — populated by api.js
  data: {
    todayNeos:    [],
    hazardNeos:   [],
    historyNeos:  [],
    historyTotal: 0,
  },

  // Whether a data source has been fetched at least once
  loaded: {
    today:   false,
    hazard:  false,
    history: false,
  },

  // UI-level state (filters, pagination, live instances)
  ui: {
    todayFilter: {
      hazardousOnly: false,
      sortBy: 'date',
    },
    historyPage:    0,
    historySearch:  '',
    historyDateMin: '',
    historyDateMax: '',
    globeInstance:  null,   // globe.gl instance
    hazardChart:    null,   // Chart.js instance
    selectedNeo:    null,   // currently focused NEO on globe
  },
};
