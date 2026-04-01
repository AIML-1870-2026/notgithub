/* ══════════════════════════════════════════════════════
   config.js — Application configuration
══════════════════════════════════════════════════════ */

export const CONFIG = {
  // Register your free key at https://api.nasa.gov and paste it here
  NASA_API_KEY: 'KjXe1xp3vXVKtQUNdp7w1fCjePbe8Rvdxl6jUppb ',

  ENDPOINTS: {
    NEOWS:  'https://api.nasa.gov/neo/rest/v1/feed',
    CAD:    'https://ssd-api.jpl.nasa.gov/cad.api',
    SENTRY: 'https://ssd-api.jpl.nasa.gov/sentry.api',
  },

  // Both JPL endpoints (ssd-api.jpl.nasa.gov) omit Access-Control-Allow-Origin headers.
  // Route them through corsproxy.io which re-serves the response with CORS headers.
  // The proxy receives the full encoded target URL (including its own query params).
  CORS_PROXY: 'https://corsproxy.io/?',

  // Endpoints that require the proxy (matched by substring)
  PROXY_HOSTS: ['ssd-api.jpl.nasa.gov'],

  // Globe colors
  GLOBE_BG:          '#0a0e1a',
  GLOBE_ATMOSPHERE:  '#00d4ff',
  HAZARD_COLOR:      '#ff4757',
  SAFE_COLOR:        '#00d4ff',
  MOON_COLOR:        '#ffd600',

  // 1 lunar distance in AU
  MOON_ORBIT_AU: 0.00257,

  // SBDB CAD defaults
  CAD_DIST_MAX:  '0.05',
  CAD_PAGE_SIZE: 30,

  // How many Sentry objects to show in the chart
  SENTRY_CHART_LIMIT: 20,
};
