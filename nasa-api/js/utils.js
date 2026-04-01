/* ══════════════════════════════════════════════════════
   utils.js — Formatting helpers and small utilities
══════════════════════════════════════════════════════ */

import { CONFIG } from './config.js';

// ── Date helpers ─────────────────────────────────────

export function formatDate(date) {
  return date.toISOString().split('T')[0]; // → "YYYY-MM-DD"
}

export function todayStr() {
  return formatDate(new Date());
}

export function dateOffsetStr(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

// Parse JPL CAD date: "2026-Mar-25 02:07"
export function formatCADDate(cadStr) {
  if (!cadStr) return 'Unknown';
  const parts = cadStr.split(' ');
  return parts[0] + (parts[1] ? ' ' + parts[1].substring(0, 5) : '');
}

export function cardDateStr(dateStr) {
  try {
    const d = new Date(dateStr + 'T12:00:00Z');
    return d.toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC',
    });
  } catch {
    return dateStr;
  }
}

// ── Number formatters ────────────────────────────────

export function fmtNum(n, decimals = 1) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return Number(n).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function fmtInt(n) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return Math.round(n).toLocaleString('en-US');
}

export function fmtDiam(meters) {
  if (!meters || isNaN(meters)) return '—';
  if (meters >= 1000) return fmtNum(meters / 1000, 2) + ' km';
  return fmtInt(meters) + ' m';
}

export function fmtAU(au) {
  if (!au || isNaN(au)) return '—';
  return fmtNum(au, 4) + ' AU';
}

export function fmtLD(au) {
  if (!au || isNaN(au)) return '—';
  return fmtNum(au / CONFIG.MOON_ORBIT_AU, 1) + ' LD';
}

export function fmtKm(km) {
  if (!km || isNaN(km)) return '—';
  return fmtInt(km) + ' km';
}

// ── UI helpers ───────────────────────────────────────

export function emptyState(icon, title, sub) {
  return `
    <div class="empty-state">
      <div class="empty-icon">${icon}</div>
      <div class="empty-title">${title}</div>
      <div class="empty-sub">${sub}</div>
    </div>
  `;
}

export function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-dot"></span><span>${msg}</span>`;
  container.appendChild(toast);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('toast-visible'));
  });
  setTimeout(() => {
    toast.classList.remove('toast-visible');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, 4500);
}

export function renderSkeletons(containerId, count = 6) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = Array.from({ length: count }, () => `
    <div class="neo-card" aria-hidden="true">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:12px">
        <div class="skeleton" style="height:18px;width:70px;border-radius:999px"></div>
        <div class="skeleton" style="height:12px;width:80px"></div>
      </div>
      <div class="skeleton" style="height:18px;width:80%;margin-bottom:12px"></div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
        <div class="skeleton" style="height:42px"></div>
        <div class="skeleton" style="height:42px"></div>
        <div class="skeleton" style="height:42px"></div>
      </div>
    </div>
  `).join('');
}

export function renderTimelineSkeletons(count = 8) {
  // Replace content with a simple loading message rather than timeline-entry
  // divs that would conflict with the D3 scatter plot container structure.
  const el = document.getElementById('history-timeline');
  if (!el) return;
  el.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;height:300px;gap:12px;color:#4a5568;font-size:13px;font-family:system-ui,sans-serif">
      <div class="skeleton" style="width:180px;height:14px;border-radius:4px"></div>
    </div>
  `;
}
