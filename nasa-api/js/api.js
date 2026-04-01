/* ══════════════════════════════════════════════════════
   api.js — API fetch functions and data transformers
   Sources: NeoWs (NASA), SBDB CAD (JPL), Sentry (JPL)
══════════════════════════════════════════════════════ */

import { CONFIG } from './config.js';
import { STATE }  from './state.js';
import { todayStr, dateOffsetStr } from './utils.js';

// ── Generic fetch wrapper ────────────────────────────

export async function apiFetch(url, params = {}) {
  // Strip accidental whitespace from all string values (e.g. trailing space in API key)
  const cleaned = Object.fromEntries(
    Object.entries(params).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])
  );
  const qs        = new URLSearchParams(cleaned).toString();
  const targetUrl = qs ? `${url}?${qs}` : url;

  // Auto-proxy any host that doesn't send CORS headers from the browser
  const needsProxy = CONFIG.PROXY_HOSTS.some(h => url.includes(h));
  const fullUrl    = needsProxy
    ? `${CONFIG.CORS_PROXY}${encodeURIComponent(targetUrl)}`
    : targetUrl;

  const res = await fetch(fullUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${targetUrl}`);
  return res.json();
}

// ── NeoWs (NASA) ─────────────────────────────────────

export async function fetchNeoFeed() {
  const data = await apiFetch(CONFIG.ENDPOINTS.NEOWS, {
    start_date: todayStr(),
    end_date:   dateOffsetStr(6),
    api_key:    CONFIG.NASA_API_KEY,
  });
  STATE.data.todayNeos = transformNeoFeed(data);
  STATE.loaded.today   = true;
}

function transformNeoFeed(raw) {
  const result = [];
  for (const [date, neos] of Object.entries(raw.near_earth_objects || {})) {
    for (const neo of neos) {
      const approach = neo.close_approach_data?.[0];
      if (!approach) continue;

      const diamMin = neo.estimated_diameter?.meters?.estimated_diameter_min ?? 0;
      const diamMax = neo.estimated_diameter?.meters?.estimated_diameter_max ?? 0;

      result.push({
        id:        neo.id,
        name:      neo.name.replace(/[()]/g, '').trim(),
        fullName:  neo.name,
        date,
        dateMs:    new Date(date + 'T00:00:00Z').getTime(),
        distAU:    parseFloat(approach.miss_distance?.astronomical)         || 0,
        distKm:    parseFloat(approach.miss_distance?.kilometers)           || 0,
        distLunar: parseFloat(approach.miss_distance?.lunar)                || 0,
        velKmS:    parseFloat(approach.relative_velocity?.kilometers_per_second) || 0,
        velKmH:    parseFloat(approach.relative_velocity?.kilometers_per_hour)   || 0,
        diamMinM:  diamMin,
        diamMaxM:  diamMax,
        diamAvgM:  (diamMin + diamMax) / 2,
        hazardous: neo.is_potentially_hazardous_asteroid === true,
        isSentry:  neo.is_sentry_object === true,
        magnitude: neo.absolute_magnitude_h,
        jplUrl:    neo.nasa_jpl_url || '#',
      });
    }
  }
  return result.sort((a, b) => a.dateMs - b.dateMs);
}

// ── JPL Sentry ───────────────────────────────────────

export async function fetchSentry() {
  const data = await apiFetch(CONFIG.ENDPOINTS.SENTRY);
  STATE.data.hazardNeos = transformSentry(data);
  STATE.loaded.hazard   = true;
}

function transformSentry(raw) {
  if (!raw?.data) return [];
  return raw.data.map(obj => ({
    id:          obj.id,
    designation: obj.des,
    fullName:    obj.fullname || obj.des,
    diameter:    parseFloat(obj.diameter) || null,
    lastObs:     obj.last_obs || '',
    nImpacts:    parseInt(obj.n_imp) || 0,
    psMax:       parseFloat(obj.ps_max) || -99,
    psCum:       parseFloat(obj.ps_cum) || -99,
    probability: parseFloat(obj.ip)     || 0,
    vInf:        parseFloat(obj.v_inf)  || 0,
    range:       obj.range              || '—',
    tsMax:       parseInt(obj.ts_max)   || 0,
  })).sort((a, b) => b.psCum - a.psCum);
}

// ── SBDB Close-Approach Data (JPL) ───────────────────

export async function fetchCAD(page = 0) {
  // Note: SBDB CAD API does not have a sort-dir param.
  // Prefix the sort field with '-' for descending (e.g. '-date').
  const params = {
    'dist-max': CONFIG.CAD_DIST_MAX,
    'date-min': STATE.ui.historyDateMin || '2020-01-01',
    'date-max': STATE.ui.historyDateMax || todayStr(),
    'sort':       'date',
    'limit':      CONFIG.CAD_PAGE_SIZE,
    'limit-from': page * CONFIG.CAD_PAGE_SIZE,
  };
  if (STATE.ui.historySearch) params.des = STATE.ui.historySearch;

  const data = await apiFetch(CONFIG.ENDPOINTS.CAD, params);
  STATE.data.historyNeos  = transformCAD(data);
  STATE.data.historyTotal = parseInt(data.count) || STATE.data.historyNeos.length;
  STATE.loaded.history    = true;
}

function transformCAD(raw) {
  if (!raw?.data || !raw?.fields) return [];
  const { fields, data } = raw;
  return data.map(row => {
    // CAD returns parallel arrays — zip into an object
    const obj = Object.fromEntries(fields.map((f, i) => [f, row[i]]));
    const distAU = parseFloat(obj.dist) || 0;
    return {
      designation: obj.des           || '—',
      date:        obj.cd            || '',
      distAU,
      distMinAU:   parseFloat(obj.dist_min) || distAU,
      distMaxAU:   parseFloat(obj.dist_max) || distAU,
      distLunar:   distAU / CONFIG.MOON_ORBIT_AU,
      velRelKmS:   parseFloat(obj.v_rel) || null,
      velInfKmS:   parseFloat(obj.v_inf) || null,
      magnitude:   parseFloat(obj.h)     || null,
      uncertainty: obj.t_sigma_f         || '—',
    };
  });
}
