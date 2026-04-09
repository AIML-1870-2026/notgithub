/**
 * theme.js — Dark / light mode management
 */

const STORAGE_KEY = 'prg-theme';

export function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEY) || 'dark';
  _apply(saved);
}

export function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  _apply(current === 'dark' ? 'light' : 'dark');
}

function _apply(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEY, theme);

  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
}
