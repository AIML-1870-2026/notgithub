/* ══════════════════════════════════════════════════════
   router.js — Tab switching and lazy-load logic
══════════════════════════════════════════════════════ */

import { STATE }                      from './state.js';
import { initGlobe, updateGlobePoints } from './globe.js';
import { loadTodayData, renderTodayTab } from './tabs/today.js';
import { loadHazardData, renderHazardTab } from './tabs/hazard.js';
import { loadHistoryData, renderHistoryTab } from './tabs/history.js';
import { populateSizeSelector, renderSizeTab } from './tabs/size.js';

export function switchTab(tabId) {
  // Update nav buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    const active = btn.dataset.tab === tabId;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  });

  // Swap visible panel
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(`tab-${tabId}`)?.classList.add('active');

  STATE.activeTab = tabId;

  switch (tabId) {
    case 'globe':
      if (!STATE.ui.globeInstance) initGlobe();
      if (STATE.data.todayNeos.length && STATE.ui.globeInstance) {
        updateGlobePoints(STATE.data.todayNeos);
      }
      // Resume auto-rotation
      STATE.ui.globeInstance?.controls().autoRotate && null;
      if (STATE.ui.globeInstance) STATE.ui.globeInstance.controls().autoRotate = true;
      break;

    case 'today':
      if (!STATE.loaded.today) loadTodayData();
      else renderTodayTab();
      break;

    case 'hazard':
      if (!STATE.loaded.hazard) {
        loadHazardData();
      } else {
        renderHazardTab();
        // Chart.js needs a nudge to resize after the canvas becomes visible
        requestAnimationFrame(() => STATE.ui.hazardChart?.resize());
      }
      break;

    case 'history':
      if (!STATE.loaded.history) loadHistoryData(0);
      else renderHistoryTab();   // re-render with correct dimensions now that tab is visible
      break;

    case 'size':
      if (!STATE.loaded.today) {
        loadTodayData().then(populateSizeSelector);
      } else {
        const selEl = document.getElementById('size-neo-select');
        if (!selEl?.options.length) {
          populateSizeSelector();
        } else {
          const selected = STATE.data.todayNeos.find(n => n.id === selEl.value);
          renderSizeTab(selected ?? STATE.data.todayNeos[0]);
        }
      }
      break;
  }
}
