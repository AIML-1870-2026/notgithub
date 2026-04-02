/* ════════════════════════════════════════════════════════
   views/timeline.js — Tab 3: Recall Timeline
   ════════════════════════════════════════════════════════ */

import { STATE }               from '../state.js';
import { fetchTimelineRecalls } from '../api.js';
import { showToast, clearSkeleton } from '../ui.js';
import { renderRecallTimeline } from '../charts/recallTimeline.js';

export async function runTimeline(drugName) {
  if (!drugName?.trim()) return;

  const name      = drugName.trim();
  const card      = document.getElementById('timeline-card');
  const skeleton  = document.getElementById('timeline-skeleton');
  const empty     = document.getElementById('timeline-empty');
  const legend    = document.getElementById('recall-legend-row');

  // Show skeleton
  card?.classList.add('hidden');
  legend?.classList.add('hidden');
  empty?.classList.add('hidden');

  if (skeleton) {
    skeleton.classList.remove('hidden');
    skeleton.innerHTML = `
      <div class="skeleton-card">
        <div class="skeleton-title"><div class="shimmer"></div></div>
        <div style="height:240px;border-radius:var(--r-lg);overflow:hidden;margin-top:16px">
          <div class="shimmer" style="height:100%"></div>
        </div>
      </div>
    `;
  }

  try {
    const result = await fetchTimelineRecalls(name);
    clearSkeleton('timeline-skeleton');

    if (!result.recalls?.length) {
      empty?.classList.remove('hidden');
      const sub = document.getElementById('timeline-empty-sub');
      if (sub) sub.textContent = `No recall records found for "${name}"`;
      return;
    }

    renderTimelineResults(result);

  } catch (err) {
    clearSkeleton('timeline-skeleton');
    empty?.classList.remove('hidden');
    showToast('Could not load recall data.', 'error');
    console.error('Timeline error:', err);
  }
}

function renderTimelineResults(result) {
  const card   = document.getElementById('timeline-card');
  const legend = document.getElementById('recall-legend-row');

  if (card) {
    card.classList.remove('hidden');
    card.classList.add('entering');
    setTimeout(() => card.classList.remove('entering'), 400);

    const label = document.getElementById('timeline-drug-label');
    if (label) {
      const counts = countByClass(result.recalls);
      label.textContent =
        `${result.name} — ${result.recalls.length} recall record${result.recalls.length !== 1 ? 's' : ''}` +
        (result.recallCount > result.recalls.length
          ? ` (showing ${result.recalls.length} of ${result.recallCount.toLocaleString()} total)`
          : '');
    }
  }

  if (legend) {
    legend.classList.remove('hidden');
    const totalLabel = document.getElementById('recall-total-label');
    if (totalLabel) {
      totalLabel.textContent = `${result.recalls.length} record${result.recalls.length !== 1 ? 's' : ''} shown`;
    }
  }

  // D3 re-renders on each search
  renderRecallTimeline('recall-timeline-svg', result.recalls, 'd3-tooltip');

  // Resize handler: re-render on window resize
  STATE.ui.timelineRendered = true;
}

function countByClass(recalls) {
  return recalls.reduce((acc, r) => {
    acc[r.classLevel] = (acc[r.classLevel] ?? 0) + 1;
    return acc;
  }, {});
}

/* Handle window resize for the timeline SVG */
export function initTimelineResize() {
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    if (!STATE.ui.timelineRendered || !STATE.data.timelineDrug?.recalls?.length) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      renderRecallTimeline('recall-timeline-svg', STATE.data.timelineDrug.recalls, 'd3-tooltip');
    }, 300);
  });
}
