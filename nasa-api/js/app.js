/* ══════════════════════════════════════════════════════
   app.js — Application entry point
   Wires events, bootstraps data fetching, and calls init.
══════════════════════════════════════════════════════ */

import { CONFIG }                            from './config.js';
import { STATE }                             from './state.js';
import { todayStr, dateOffsetStr,
         showToast, renderSkeletons,
         renderTimelineSkeletons }           from './utils.js';
import { fetchNeoFeed, fetchSentry, fetchCAD } from './api.js';
import { initGlobe, updateGlobePoints }      from './globe.js';
import { renderTodayTab, renderTodayStats }  from './tabs/today.js';
import { renderHazardTab }                   from './tabs/hazard.js';
import { renderHistoryTab,
         renderHistoryPagination }           from './tabs/history.js';
import { populateSizeSelector }              from './tabs/size.js';
import { switchTab }                         from './router.js';

// ── Event wiring ─────────────────────────────────────

function wireEvents() {
  // Tab navigation
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Today's filter controls
  document.getElementById('filter-hazardous')?.addEventListener('change', e => {
    STATE.ui.todayFilter.hazardousOnly = e.target.checked;
    if (STATE.loaded.today) renderTodayTab();
  });

  document.getElementById('sort-today')?.addEventListener('change', e => {
    STATE.ui.todayFilter.sortBy = e.target.value;
    if (STATE.loaded.today) renderTodayTab();
  });

  // History search bar
  const searchInput = document.getElementById('history-search');
  const searchClear = document.getElementById('history-clear');
  const searchBtn   = document.getElementById('history-search-btn');

  searchInput?.addEventListener('input', e => {
    searchClear?.classList.toggle('hidden', !e.target.value.trim());
  });

  searchClear?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    searchClear.classList.add('hidden');
    STATE.ui.historySearch  = '';
    STATE.ui.historyDateMin = '';
    STATE.ui.historyDateMax = '';
    const minEl = document.getElementById('history-date-min');
    const maxEl = document.getElementById('history-date-max');
    if (minEl) minEl.value = '';
    if (maxEl) maxEl.value = '';
    import('./tabs/history.js').then(m => m.loadHistoryData(0));
  });

  searchBtn?.addEventListener('click', () => {
    STATE.ui.historySearch  = searchInput?.value.trim() || '';
    STATE.ui.historyDateMin = document.getElementById('history-date-min')?.value || '';
    STATE.ui.historyDateMax = document.getElementById('history-date-max')?.value || '';
    import('./tabs/history.js').then(m => m.loadHistoryData(0));
  });

  searchInput?.addEventListener('keydown', e => {
    if (e.key === 'Enter') searchBtn?.click();
  });

  // Globe info panel close button
  document.getElementById('globe-info-close')?.addEventListener('click', () => {
    document.getElementById('globe-info-panel')?.classList.add('hidden');
    if (STATE.ui.globeInstance) {
      STATE.ui.globeInstance.controls().autoRotate = true;
    }
  });

  // Size comparison selector
  document.getElementById('size-neo-select')?.addEventListener('change', e => {
    const neo = STATE.data.todayNeos.find(n => n.id === e.target.value);
    if (neo) import('./tabs/size.js').then(m => m.renderSizeTab(neo));
  });
}

// ── Bootstrap ─────────────────────────────────────────

async function init() {
  wireEvents();

  // Initialize globe on the first (default) tab
  initGlobe();

  // Set default date range for history search (last 2 years → today)
  const minEl = document.getElementById('history-date-min');
  const maxEl = document.getElementById('history-date-max');
  if (minEl && !minEl.value) minEl.value = dateOffsetStr(-730);
  if (maxEl && !maxEl.value) maxEl.value = todayStr();
  STATE.ui.historyDateMin = minEl?.value || '';
  STATE.ui.historyDateMax = maxEl?.value || '';

  // Show skeleton states immediately so the UI feels responsive
  renderSkeletons('today-grid', 8);
  renderTimelineSkeletons(8);

  // Fetch all three APIs concurrently
  const [neoResult, sentryResult, cadResult] = await Promise.allSettled([
    fetchNeoFeed(),
    fetchSentry(),
    fetchCAD(0),
  ]);

  // Handle NeoWs result
  if (neoResult.status === 'fulfilled') {
    renderTodayTab();
    renderTodayStats();
    populateSizeSelector();
    if (STATE.ui.globeInstance) updateGlobePoints(STATE.data.todayNeos);
  } else {
    console.error('[NEOWatch] NeoWs failed:', neoResult.reason);
    showToast('NeoWs API unavailable. Check your API key in js/config.js.', 'error');
  }

  // Handle Sentry result
  if (sentryResult.status === 'fulfilled') {
    renderHazardTab();
  } else {
    console.error('[NEOWatch] Sentry failed:', sentryResult.reason);
  }

  // Handle CAD result
  if (cadResult.status === 'fulfilled') {
    renderHistoryTab();
    renderHistoryPagination();
  } else {
    console.error('[NEOWatch] CAD failed:', cadResult.reason);
  }

  // Update the "last updated" timestamp in the header
  const tsEl = document.getElementById('last-updated');
  if (tsEl) {
    tsEl.textContent = 'Updated ' + new Date().toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit',
    });
  }

  // Remind user to set their API key if still using DEMO_KEY
  if (CONFIG.NASA_API_KEY === 'DEMO_KEY') {
    setTimeout(() => {
      showToast('Using DEMO_KEY — add your NASA API key in js/config.js for full access.', 'info');
    }, 1500);
  }
}

document.addEventListener('DOMContentLoaded', init);
