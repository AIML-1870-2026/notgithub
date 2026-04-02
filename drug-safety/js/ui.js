/* ════════════════════════════════════════════════════════
   ui.js — Toast, Skeleton, Help Modal utilities
   ════════════════════════════════════════════════════════ */

import { CONFIG } from './config.js';

/* ── Toast ── */
let toastTimer = null;

export function showToast(message, type = 'default') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  // Remove any existing toast
  const existing = container.querySelector('.toast');
  if (existing) existing.remove();

  const icons = { error: '⚠️', success: '✓', default: 'ℹ️' };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `<span class="toast-icon">${icons[type] ?? icons.default}</span><span>${message}</span>`;
  container.appendChild(toast);

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.add('toast-exiting');
    setTimeout(() => toast.remove(), 220);
  }, 3500);
}

/* ── Skeleton Loaders ── */
export function renderSkeletonSearch(containerIds) {
  const { statsId, skeletonId, chartId, emptyId } = containerIds;

  // hide chart + empty, show skeleton
  document.getElementById(chartId)?.classList.add('hidden');
  document.getElementById(emptyId)?.classList.add('hidden');
  document.getElementById(statsId)?.classList.add('hidden');

  const el = document.getElementById(skeletonId);
  if (!el) return;
  el.classList.remove('hidden');
  el.innerHTML = `
    <div class="skeleton-stats">
      ${[1, 2, 3].map(() => `
        <div class="skeleton-stat">
          <div class="shimmer" style="border-radius:var(--r-lg)"></div>
        </div>
      `).join('')}
    </div>
    <div class="skeleton-card">
      <div class="skeleton-title"><div class="shimmer"></div></div>
      <div class="skeleton-sub"><div class="shimmer"></div></div>
      <div class="skeleton-bar-row">
        ${[90, 78, 65, 55, 47, 40, 34, 28, 22, 16].map(w => `
          <div class="skeleton-bar" style="width:${w}%">
            <div class="shimmer"></div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

export function clearSkeleton(skeletonId) {
  const el = document.getElementById(skeletonId);
  if (el) {
    el.classList.add('hidden');
    el.innerHTML = '';
  }
}

export function showEmpty(emptyId, titleOverride, subOverride) {
  const el = document.getElementById(emptyId);
  if (!el) return;
  el.classList.remove('hidden');
  if (titleOverride) {
    const t = el.querySelector('.empty-title');
    if (t) t.textContent = titleOverride;
  }
  if (subOverride) {
    const s = el.querySelector('.empty-sub');
    if (s) s.textContent = subOverride;
  }
}

/* ── Help Modal ── */
export function showHelp(key) {
  const content = CONFIG.HELP_CONTENT[key];
  if (!content) return;

  const overlay  = document.getElementById('help-overlay');
  const iconWrap = document.getElementById('help-icon-wrap');
  const title    = document.getElementById('help-title');
  const body     = document.getElementById('help-body');

  if (!overlay || !title || !body) return;

  if (iconWrap) iconWrap.textContent = content.icon || '?';
  title.textContent = content.title;
  body.innerHTML    = content.body;
  overlay.classList.remove('hidden');

  // focus trap: focus the close button
  setTimeout(() => document.getElementById('help-close')?.focus(), 50);
}

export function hideHelp() {
  document.getElementById('help-overlay')?.classList.add('hidden');
}

/* ── Number animation (count-up for stat values) ── */
export function animateNumber(el, targetValue, duration = 600) {
  if (!el) return;
  const start     = 0;
  const startTime = performance.now();

  function step(now) {
    const elapsed  = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease     = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
    const current  = Math.round(start + (targetValue - start) * ease);
    el.textContent = current.toLocaleString();
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
  el.classList.add('animated');
}

/* ── Delegate all help button clicks (called once from main.js) ── */
export function initHelpDelegation() {
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-help]');
    if (btn) showHelp(btn.dataset.help);
  });

  document.getElementById('help-close')?.addEventListener('click', hideHelp);
  document.getElementById('help-overlay')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) hideHelp();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') hideHelp();
  });
}
