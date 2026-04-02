/* ════════════════════════════════════════════════════════
   views/search.js — Tab 1: Drug Search + Adverse Events
   ════════════════════════════════════════════════════════ */

import { STATE }             from '../state.js';
import { fetchDrugProfile, formatNumber } from '../api.js';
import { showToast, renderSkeletonSearch, clearSkeleton, animateNumber } from '../ui.js';
import { renderAdverseBar, destroyChart } from '../charts/adverseBar.js';

const IDS = {
  statsRow:   'search-stats-row',
  chartCard:  'search-chart-card',
  skeletonId: 'search-skeleton',
  emptyId:    'search-empty',
};

/* ── Trigger a drug search ── */
export async function runSearch(drugName) {
  if (!drugName?.trim()) return;

  const name = drugName.trim();

  // Show skeleton, hide previous results
  renderSkeletonSearch({
    statsId:    IDS.statsRow,
    skeletonId: IDS.skeletonId,
    chartId:    IDS.chartCard,
    emptyId:    IDS.emptyId,
  });

  try {
    const profile = await fetchDrugProfile(name);

    clearSkeleton(IDS.skeletonId);

    if (!profile || (profile.totalEvents === 0 && profile.recallCount === 0)) {
      document.getElementById(IDS.emptyId)?.classList.remove('hidden');
      const t = document.querySelector('#search-empty .empty-title');
      if (t) t.textContent = `No data found for "${name}"`;
      const s = document.querySelector('#search-empty .empty-sub');
      if (s) s.textContent = 'Try a different spelling or generic name';
      return;
    }

    renderSearchResults(profile);

  } catch (err) {
    clearSkeleton(IDS.skeletonId);
    document.getElementById(IDS.emptyId)?.classList.remove('hidden');
    showToast('Could not load drug data. Check your connection.', 'error');
    console.error('Search error:', err);
  }
}

/* ── Render results into the DOM ── */
function renderSearchResults(profile) {
  /* Stats row */
  const statsRow = document.getElementById(IDS.statsRow);
  if (statsRow) {
    statsRow.classList.remove('hidden');

    const totalEl = document.getElementById('val-total-events');
    const recallEl = document.getElementById('val-active-recalls');
    const warnEl  = document.getElementById('val-label-warnings');

    animateNumber(totalEl,  profile.totalEvents, 800);
    animateNumber(recallEl, profile.recallCount,  600);

    const warnCount = Array.isArray(profile.warnings) ? profile.warnings.length : 0;
    if (warnEl) {
      if (warnCount > 0) {
        animateNumber(warnEl, warnCount, 500);
      } else {
        warnEl.textContent = 'None listed';
      }
    }
  }

  /* Chart card */
  const chartCard = document.getElementById(IDS.chartCard);
  if (chartCard) {
    chartCard.classList.remove('hidden');
    chartCard.classList.add('entering');
    setTimeout(() => chartCard.classList.remove('entering'), 400);

    const subLabel = document.getElementById('search-drug-name-label');
    if (subLabel) {
      subLabel.textContent = `${profile.name} — ${profile.totalEvents.toLocaleString()} total FAERS reports`;
    }
  }

  /* Render bar chart */
  if (profile.events?.length) {
    destroyChart('adverse-bar-canvas');
    renderAdverseBar('adverse-bar-canvas', profile.events, {
      color:    '#007AFF',
      colorDim: 'rgba(0,122,255,0.12)',
    });
  } else {
    const cc = document.getElementById(IDS.chartCard);
    if (cc) {
      const wrap = cc.querySelector('.chart-wrap');
      if (wrap) wrap.innerHTML = '<p style="padding:24px;color:var(--text-secondary);font-size:14px">No reaction data available for this drug.</p>';
    }
  }
}
