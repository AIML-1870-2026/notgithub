/* ════════════════════════════════════════════════════════
   views/classes.js — Tab 4: Drug Class Explorer
   ════════════════════════════════════════════════════════ */

import { CONFIG }            from '../config.js';
import { STATE }             from '../state.js';
import { fetchClassProfile }  from '../api.js';
import { showToast, clearSkeleton, animateNumber } from '../ui.js';
import { renderAdverseBar, destroyChart } from '../charts/adverseBar.js';

/* ── Inject class selector chips into DOM ── */
export function initClassSelector() {
  const row = document.getElementById('class-selector-row');
  if (!row) return;

  Object.entries(CONFIG.DRUG_CLASSES).forEach(([key, def]) => {
    const btn = document.createElement('button');
    btn.className    = `class-chip${key === STATE.ui.activeClass ? ' active' : ''}`;
    btn.dataset.class = key;
    btn.textContent  = def.label;
    row.appendChild(btn);
  });

  row.addEventListener('click', e => {
    const btn = e.target.closest('.class-chip');
    if (!btn) return;
    const classKey = btn.dataset.class;
    if (!classKey) return;

    // Update active chip
    row.querySelectorAll('.class-chip').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    STATE.ui.activeClass = classKey;
    loadClass(classKey);
  });
}

/* ── Load and render a drug class profile ── */
export async function loadClass(classKey) {
  const statsRow    = document.getElementById('class-stats-row');
  const chartCard   = document.getElementById('class-chart-card');
  const drugList    = document.getElementById('class-drug-list');
  const skeleton    = document.getElementById('class-skeleton');
  const empty       = document.getElementById('class-empty');

  // Show skeleton
  statsRow?.classList.add('hidden');
  chartCard?.classList.add('hidden');
  drugList?.classList.add('hidden');
  empty?.classList.add('hidden');

  if (skeleton) {
    skeleton.classList.remove('hidden');
    skeleton.innerHTML = `
      <div class="skeleton-stats">
        ${[1, 2].map(() => `
          <div class="skeleton-stat"><div class="shimmer" style="border-radius:var(--r-lg)"></div></div>
        `).join('')}
      </div>
      <div class="skeleton-card" style="margin-top:0">
        <div class="skeleton-title"><div class="shimmer"></div></div>
        <div class="skeleton-sub"><div class="shimmer"></div></div>
        <div class="skeleton-bar-row">
          ${[90,78,65,55,47,40,34,28,22,16].map(w =>
            `<div class="skeleton-bar" style="width:${w}%"><div class="shimmer"></div></div>`
          ).join('')}
        </div>
      </div>
    `;
  }

  try {
    const profile = await fetchClassProfile(classKey);
    clearSkeleton('class-skeleton');

    if (!profile || !profile.events?.length) {
      empty?.classList.remove('hidden');
      return;
    }

    renderClassResults(profile);

  } catch (err) {
    clearSkeleton('class-skeleton');
    empty?.classList.remove('hidden');
    showToast('Could not load drug class data.', 'error');
    console.error('Class error:', err);
  }
}

function renderClassResults(profile) {
  /* Stats */
  const statsRow = document.getElementById('class-stats-row');
  if (statsRow) {
    statsRow.classList.remove('hidden');
    animateNumber(document.getElementById('val-class-events'), profile.totalEvents, 800);
    const drugCountEl = document.getElementById('val-class-drugs');
    if (drugCountEl) {
      animateNumber(drugCountEl, profile.drugs.length, 400);
    }
  }

  /* Chart card */
  const chartCard = document.getElementById('class-chart-card');
  if (chartCard) {
    chartCard.classList.remove('hidden');
    chartCard.classList.add('entering');
    setTimeout(() => chartCard.classList.remove('entering'), 400);

    const title = document.getElementById('class-chart-title');
    if (title) title.textContent = `Top Adverse Reactions — ${profile.className}`;

    const sub = document.getElementById('class-chart-sub');
    if (sub) sub.textContent = `${profile.totalEvents.toLocaleString()} total reports across class`;
  }

  /* Render chart */
  destroyChart('class-bar-canvas');
  renderAdverseBar('class-bar-canvas', profile.events, {
    color:    '#AF52DE',   // purple for drug classes
    colorDim: 'rgba(175,82,222,0.12)',
  });

  /* Drug list */
  const drugList  = document.getElementById('class-drug-list');
  const drugChips = document.getElementById('class-drug-chips');
  if (drugList && drugChips) {
    drugList.classList.remove('hidden');
    drugChips.innerHTML = profile.drugs
      .map(d => `<span class="drug-chip">${d}</span>`)
      .join('');
  }
}
