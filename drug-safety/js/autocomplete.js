/* ════════════════════════════════════════════════════════
   autocomplete.js — Debounced typeahead search
   Each call to initAutocomplete() creates an independent
   closure with its own timer and keyboard state.
   ════════════════════════════════════════════════════════ */

import { CONFIG }             from './config.js';
import { fetchNDCSuggestions } from './api.js';

/* ─────────────────────────────────────────────────────────
   initAutocomplete(inputId, dropdownId, onSelect)
   onSelect(drugName: string) fires when user picks a result
   ───────────────────────────────────────────────────────── */
export function initAutocomplete(inputId, dropdownId, onSelect) {
  const input    = document.getElementById(inputId);
  const dropdown = document.getElementById(dropdownId);
  if (!input || !dropdown) return;

  let debounceTimer = null;
  let activeIndex   = -1;
  let lastQuery     = '';
  let suggestions   = [];

  /* ── Render dropdown items ── */
  function renderDropdown(names) {
    suggestions = names;
    activeIndex = -1;

    if (!names.length) {
      clearDropdown();
      return;
    }

    const query = input.value.trim().toUpperCase();
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');

    const ul = document.createElement('ul');
    ul.setAttribute('role', 'listbox');

    names.forEach((name, i) => {
      const li = document.createElement('li');
      li.className    = 'autocomplete-item';
      li.setAttribute('role', 'option');
      li.setAttribute('id', `${dropdownId}-item-${i}`);
      li.setAttribute('tabindex', '-1');

      li.innerHTML = `
        <svg class="autocomplete-item-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="6" cy="6" r="4.5" stroke="currentColor" stroke-width="1.5"/>
          <path d="M9.5 9.5L12.5 12.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <span>${name.replace(regex, '<mark>$1</mark>')}</span>
      `;

      li.addEventListener('mousedown', e => {
        e.preventDefault(); // prevent input blur before we read the value
        selectSuggestion(name);
      });

      ul.appendChild(li);
    });

    dropdown.innerHTML = '';
    dropdown.appendChild(ul);
    dropdown.classList.remove('hidden');
    input.setAttribute('aria-expanded', 'true');
  }

  /* ── Show loading state ── */
  function showLoading() {
    dropdown.innerHTML = `
      <div class="autocomplete-loading">
        <span class="spinner spinner-sm"></span>
        <span>Searching…</span>
      </div>
    `;
    dropdown.classList.remove('hidden');
  }

  /* ── Clear / hide dropdown ── */
  function clearDropdown() {
    dropdown.classList.add('hidden');
    dropdown.innerHTML = '';
    input.setAttribute('aria-expanded', 'false');
    activeIndex  = -1;
    suggestions  = [];
  }

  /* ── Select a suggestion ── */
  function selectSuggestion(name) {
    input.value = name;
    clearDropdown();
    lastQuery = name;
    if (typeof onSelect === 'function') onSelect(name);
  }

  /* ── Update keyboard-focused item ── */
  function updateFocus(index) {
    const items = dropdown.querySelectorAll('.autocomplete-item');
    items.forEach((item, i) => {
      item.classList.toggle('focused', i === index);
    });
    if (index >= 0 && items[index]) {
      items[index].scrollIntoView({ block: 'nearest' });
    }
  }

  /* ── Input event handler ── */
  input.addEventListener('input', () => {
    const query = input.value.trim();

    // Show clear button if text present
    const clearBtn = document.getElementById(inputId.replace('input', 'clear').replace('-search-', '-search-clear'));
    // Try finding a sibling clear button by convention
    const wrap = input.closest('.search-input-wrap');
    if (wrap) {
      const cb = wrap.querySelector('.search-clear-btn');
      if (cb) cb.classList.toggle('hidden', query.length === 0);
    }

    if (query.length < CONFIG.MIN_SEARCH_CHARS) {
      clearDropdown();
      clearTimeout(debounceTimer);
      return;
    }

    if (query === lastQuery) return;

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      showLoading();
      try {
        const results = await fetchNDCSuggestions(query);
        lastQuery     = query;
        renderDropdown(results);
      } catch {
        clearDropdown();
      }
    }, CONFIG.DEBOUNCE_MS);
  });

  /* ── Keyboard navigation ── */
  input.addEventListener('keydown', e => {
    const items = dropdown.querySelectorAll('.autocomplete-item');

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, items.length - 1);
      updateFocus(activeIndex);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
      updateFocus(activeIndex);
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        e.preventDefault();
        selectSuggestion(suggestions[activeIndex]);
      }
      // if no active index, let the form's submit handler run
    } else if (e.key === 'Escape') {
      clearDropdown();
    }
  });

  /* ── Blur: hide dropdown after slight delay (allow mousedown to fire) ── */
  input.addEventListener('blur', () => {
    setTimeout(clearDropdown, 150);
  });
}
