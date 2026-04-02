/* ════════════════════════════════════════════════════════
   views/compare.js — Tab 2: Side-by-Side Drug Comparison
   ════════════════════════════════════════════════════════ */

import { STATE }              from '../state.js';
import { fetchCompareProfiles } from '../api.js';
import { showToast, clearSkeleton } from '../ui.js';
import { renderCompareChart, COMPARE_COLORS } from '../charts/compareChart.js';

/* ── Run a comparison between two drug names ── */
export async function runCompare(nameA, nameB) {
  if (!nameA?.trim() || !nameB?.trim()) {
    showToast('Please enter two drug names to compare.', 'error');
    return;
  }

  const wrap     = document.getElementById('compare-chart-wrap');
  const skeleton = document.getElementById('compare-skeleton');
  const empty    = document.getElementById('compare-empty');

  // Show skeleton
  wrap?.classList.add('hidden');
  empty?.classList.add('hidden');
  if (skeleton) {
    skeleton.classList.remove('hidden');
    skeleton.innerHTML = `
      <div class="skeleton-card">
        <div class="skeleton-title"><div class="shimmer"></div></div>
        <div class="skeleton-sub"><div class="shimmer"></div></div>
        <div class="skeleton-bar-row">
          ${[85,70,60,85,70,60,85,70,60,85].map(w => `
            <div class="skeleton-bar" style="width:${w}%"><div class="shimmer"></div></div>
          `).join('')}
        </div>
      </div>
    `;
  }

  try {
    const [profileA, profileB] = await fetchCompareProfiles(nameA.trim(), nameB.trim());
    clearSkeleton('compare-skeleton');

    if (!profileA.totalEvents && !profileB.totalEvents) {
      empty?.classList.remove('hidden');
      const t = empty?.querySelector('.empty-title');
      if (t) t.textContent = 'No adverse event data found for these drugs';
      return;
    }

    renderCompareResults(profileA, profileB);

  } catch (err) {
    clearSkeleton('compare-skeleton');
    empty?.classList.remove('hidden');
    showToast('Could not load comparison data.', 'error');
    console.error('Compare error:', err);
  }
}

function renderCompareResults(profileA, profileB) {
  const wrap = document.getElementById('compare-chart-wrap');
  if (!wrap) return;

  wrap.classList.remove('hidden');
  wrap.classList.add('entering');
  setTimeout(() => wrap.classList.remove('entering'), 400);

  /* Update subtitle */
  const subtitle = document.getElementById('compare-subtitle');
  if (subtitle) {
    subtitle.textContent =
      `${profileA.name} (${profileA.totalEvents.toLocaleString()} reports) vs ` +
      `${profileB.name} (${profileB.totalEvents.toLocaleString()} reports)`;
  }

  /* Legend */
  const legend = document.getElementById('compare-legend');
  if (legend) {
    legend.innerHTML = `
      <span class="legend-item">
        <span class="legend-swatch" style="background:${COMPARE_COLORS.A}"></span>
        ${profileA.name}
      </span>
      <span class="legend-item">
        <span class="legend-swatch" style="background:${COMPARE_COLORS.B}"></span>
        ${profileB.name}
      </span>
    `;
  }

  /* Render D3 compare chart */
  renderCompareChart(
    'compare-svg',
    profileA.events,
    profileB.events,
    profileA.name,
    profileB.name,
  );
}
