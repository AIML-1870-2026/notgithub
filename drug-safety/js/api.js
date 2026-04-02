/* ════════════════════════════════════════════════════════
   api.js — All OpenFDA fetch wrappers
   Transforms raw responses and writes into STATE.data.*
   ════════════════════════════════════════════════════════ */

import { CONFIG } from './config.js';
import { STATE }  from './state.js';

/* ── Internal fetch helper ── */
async function apiFetch(url) {
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 404) return null;   // no results is valid
    throw new Error(`OpenFDA API error: ${res.status}`);
  }
  return res.json();
}

/* ── Encode drug name safely for OpenFDA search queries ── */
function encodeDrug(name) {
  return encodeURIComponent(`"${name.trim().toUpperCase()}"`);
}

/* ── Parse OpenFDA recall classification into I/II/III ── */
function parseClass(raw = '') {
  const s = raw.toUpperCase();
  if (s.includes('CLASS I') && !s.includes('CLASS II') && !s.includes('CLASS III')) return 'I';
  if (s.includes('CLASS II') && !s.includes('CLASS III')) return 'II';
  if (s.includes('CLASS III')) return 'III';
  return 'II'; // fallback
}

/* ── Parse YYYYMMDD → Date ── */
function parseRecallDate(str = '') {
  if (!str || str.length < 8) return new Date();
  const y = parseInt(str.slice(0, 4), 10);
  const m = parseInt(str.slice(4, 6), 10) - 1;
  const d = parseInt(str.slice(6, 8), 10);
  return new Date(y, m, d);
}

/* ── Format large numbers ── */
export function formatNumber(n) {
  if (n === null || n === undefined) return '—';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return n.toLocaleString();
  return String(n);
}

/* ════════════════════════════════════════════════════════
   fetchAdverseEvents(drugName)
   Returns: { events: [{term, count}], totalEvents: number }
   ════════════════════════════════════════════════════════ */
export async function fetchAdverseEvents(drugName) {
  const name = encodeDrug(drugName);

  const [countData, totalData] = await Promise.all([
    apiFetch(
      `${CONFIG.FDA_BASE}/drug/event.json` +
      `?search=patient.drug.medicinalproduct:${name}` +
      `&count=patient.reaction.reactionmeddrapt.exact` +
      `&limit=${CONFIG.ADVERSE_LIMIT}`
    ),
    apiFetch(
      `${CONFIG.FDA_BASE}/drug/event.json` +
      `?search=patient.drug.medicinalproduct:${name}` +
      `&limit=1`
    ),
  ]);

  const events = (countData?.results || []).map(r => ({
    term:  r.term.replace(/\b\w/g, c => c + c.slice(1).toLowerCase())
                 .replace(/\b(\w)/g, (_, c) => c.toUpperCase()),
    count: r.count,
  }));

  const totalEvents = totalData?.meta?.results?.total ?? 0;

  return { events, totalEvents };
}

/* ════════════════════════════════════════════════════════
   fetchRecalls(drugName)
   Returns: { recalls: [...], recallCount: number }
   ════════════════════════════════════════════════════════ */
export async function fetchRecalls(drugName) {
  const name = encodeURIComponent(drugName.trim().toUpperCase());

  const data = await apiFetch(
    `${CONFIG.FDA_BASE}/drug/enforcement.json` +
    `?search=product_description:${name}` +
    `&limit=${CONFIG.RECALL_LIMIT}`
  );

  if (!data || !data.results) return { recalls: [], recallCount: 0 };

  const recalls = data.results.map(r => ({
    date:       parseRecallDate(r.recall_initiation_date),
    product:    (r.product_description || '').slice(0, 80),
    reason:     (r.reason_for_recall   || '').slice(0, 120),
    classLevel: parseClass(r.classification || ''),
    status:     r.status || 'Unknown',
    firm:       r.recalling_firm || '',
  }));

  // sort ascending by date for timeline
  recalls.sort((a, b) => a.date - b.date);

  return {
    recalls,
    recallCount: data.meta?.results?.total ?? recalls.length,
  };
}

/* ════════════════════════════════════════════════════════
   fetchLabelWarnings(drugName)
   Returns: { warnings: string[] }
   ════════════════════════════════════════════════════════ */
export async function fetchLabelWarnings(drugName) {
  const name = encodeDrug(drugName);

  const data = await apiFetch(
    `${CONFIG.FDA_BASE}/drug/label.json` +
    `?search=openfda.brand_name:${name}+openfda.generic_name:${name}` +
    `&limit=1`
  );

  if (!data || !data.results || !data.results.length) {
    // fallback: search generic name only
    const fallback = await apiFetch(
      `${CONFIG.FDA_BASE}/drug/label.json` +
      `?search=openfda.generic_name:${name}` +
      `&limit=1`
    );
    if (!fallback?.results?.length) return { warnings: [] };
    const r = fallback.results[0];
    return { warnings: r.warnings || r.warnings_and_cautions || [] };
  }

  const r = data.results[0];
  return { warnings: r.warnings || r.warnings_and_cautions || [] };
}

/* ════════════════════════════════════════════════════════
   fetchDrugProfile(drugName) — combined for Tab 1
   Writes STATE.data.searchDrug
   ════════════════════════════════════════════════════════ */
export async function fetchDrugProfile(drugName) {
  const [eventsResult, recallsResult, labelsResult] = await Promise.allSettled([
    fetchAdverseEvents(drugName),
    fetchRecalls(drugName),
    fetchLabelWarnings(drugName),
  ]);

  const eventsData  = eventsResult.status  === 'fulfilled' ? eventsResult.value  : { events: [], totalEvents: 0 };
  const recallsData = recallsResult.status === 'fulfilled' ? recallsResult.value : { recalls: [], recallCount: 0 };
  const labelsData  = labelsResult.status  === 'fulfilled' ? labelsResult.value  : { warnings: [] };

  if (eventsData.totalEvents === 0 && recallsData.recallCount === 0) {
    return null; // drug not found
  }

  STATE.data.searchDrug = {
    name:        drugName.toUpperCase(),
    events:      eventsData.events,
    totalEvents: eventsData.totalEvents,
    recallCount: recallsData.recallCount,
    recalls:     recallsData.recalls,
    warnings:    labelsData.warnings,
  };

  STATE.loaded.search = true;
  return STATE.data.searchDrug;
}

/* ════════════════════════════════════════════════════════
   fetchCompareProfiles(nameA, nameB) — Tab 2
   Writes STATE.data.compareA and compareB
   ════════════════════════════════════════════════════════ */
export async function fetchCompareProfiles(nameA, nameB) {
  const [resA, resB] = await Promise.all([
    fetchAdverseEvents(nameA),
    fetchAdverseEvents(nameB),
  ]);

  STATE.data.compareA = { name: nameA.toUpperCase(), ...resA };
  STATE.data.compareB = { name: nameB.toUpperCase(), ...resB };
  STATE.loaded.compare = true;
  return [STATE.data.compareA, STATE.data.compareB];
}

/* ════════════════════════════════════════════════════════
   fetchTimelineRecalls(drugName) — Tab 3
   Writes STATE.data.timelineDrug
   ════════════════════════════════════════════════════════ */
export async function fetchTimelineRecalls(drugName) {
  const { recalls, recallCount } = await fetchRecalls(drugName);

  STATE.data.timelineDrug = {
    name:        drugName.toUpperCase(),
    recalls,
    recallCount,
  };
  STATE.loaded.timeline = true;
  return STATE.data.timelineDrug;
}

/* ════════════════════════════════════════════════════════
   fetchClassProfile(classKey) — Tab 4
   Uses pharm_class_epc field for authoritative class query
   Writes STATE.data.classProfile
   ════════════════════════════════════════════════════════ */
export async function fetchClassProfile(classKey) {
  const { CONFIG: cfg } = await import('./config.js');
  const classDef = CONFIG.DRUG_CLASSES[classKey];
  if (!classDef) return null;

  const pharmClass = encodeURIComponent(`"${classDef.pharmClass}"`);

  const [countData, totalData] = await Promise.all([
    apiFetch(
      `${CONFIG.FDA_BASE}/drug/event.json` +
      `?search=patient.drug.openfda.pharm_class_epc:${pharmClass}` +
      `&count=patient.reaction.reactionmeddrapt.exact` +
      `&limit=${CONFIG.ADVERSE_LIMIT}`
    ),
    apiFetch(
      `${CONFIG.FDA_BASE}/drug/event.json` +
      `?search=patient.drug.openfda.pharm_class_epc:${pharmClass}` +
      `&limit=1`
    ),
  ]);

  // fallback: if pharm_class_epc returns nothing, OR individual drug query
  let events      = countData?.results || [];
  let totalEvents = totalData?.meta?.results?.total ?? 0;

  if (events.length === 0) {
    // Fallback: query each drug individually, aggregate manually
    const drugResults = await Promise.allSettled(
      classDef.drugs.map(d => fetchAdverseEvents(d))
    );

    const termMap = new Map();
    let totalFallback = 0;
    for (const r of drugResults) {
      if (r.status !== 'fulfilled') continue;
      totalFallback += r.value.totalEvents;
      for (const e of r.value.events) {
        termMap.set(e.term, (termMap.get(e.term) ?? 0) + e.count);
      }
    }

    events = [...termMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, CONFIG.ADVERSE_LIMIT)
      .map(([term, count]) => ({ term, count }));
    totalEvents = totalFallback;
  } else {
    events = events.map(r => ({
      term:  r.term.replace(/\b(\w)/g, (_, c) => c.toUpperCase()),
      count: r.count,
    }));
  }

  STATE.data.classProfile = {
    classKey,
    className:   classDef.label,
    drugs:       classDef.drugs,
    events,
    totalEvents,
  };
  STATE.loaded.classes = true;
  return STATE.data.classProfile;
}

/* ════════════════════════════════════════════════════════
   fetchNDCSuggestions(query) — Autocomplete
   Returns: string[] of drug names (up to 8, deduped)
   ════════════════════════════════════════════════════════ */
export async function fetchNDCSuggestions(query) {
  const q    = query.trim().toUpperCase();
  const enc  = encodeURIComponent(q);

  const data = await apiFetch(
    `${CONFIG.FDA_BASE}/drug/ndc.json` +
    `?search=brand_name:${enc}*+generic_name:${enc}*` +
    `&limit=${CONFIG.AUTOCOMPLETE_LIMIT}`
  );

  if (!data?.results?.length) return [];

  const seen  = new Set();
  const names = [];
  for (const r of data.results) {
    const name = (r.generic_name || r.brand_name || '').trim().toUpperCase();
    if (name && !seen.has(name)) {
      seen.add(name);
      names.push(name);
    }
  }
  return names.slice(0, CONFIG.AUTOCOMPLETE_LIMIT);
}
