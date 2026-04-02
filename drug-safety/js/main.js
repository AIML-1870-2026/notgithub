/* ════════════════════════════════════════════════════════
   main.js — Application entry point
   Wires tab routing, search events, and initializes modules.
   ════════════════════════════════════════════════════════ */

import { STATE }               from './state.js';
import { initHelpDelegation }  from './ui.js';
import { initAutocomplete }    from './autocomplete.js';
import { runSearch }           from './views/search.js';
import { runCompare }          from './views/compare.js';
import { runTimeline, initTimelineResize } from './views/timeline.js';
import { initClassSelector, loadClass }    from './views/classes.js';

/* ════════════════════════════════════════════════════════
   Boot
   ════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initHelpDelegation();
  initTabNav();
  initSearchTab();
  initCompareTab();
  initTimelineTab();
  initClassesTab();
  initTimelineResize();
  showTab('search');  // ensure default tab is visible
});

/* ════════════════════════════════════════════════════════
   Tab Navigation
   ════════════════════════════════════════════════════════ */
function initTabNav() {
  const buttons = document.querySelectorAll('.tab-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      if (tab) showTab(tab);
    });
  });
}

function showTab(tabName) {
  STATE.activeTab = tabName;

  // Update buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    const isActive = btn.dataset.tab === tabName;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', String(isActive));
  });

  // Update panels
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `tab-${tabName}`);
  });
}

/* ════════════════════════════════════════════════════════
   Tab 1 — Drug Search
   ════════════════════════════════════════════════════════ */
function initSearchTab() {
  const input   = document.getElementById('drug-search-input');
  const btn     = document.getElementById('drug-search-btn');
  const exPills = document.getElementById('example-pills-1');

  /* Autocomplete */
  initAutocomplete('drug-search-input', 'autocomplete-list-1', name => {
    if (input) input.value = name;
    runSearch(name);
  });

  /* Search button */
  btn?.addEventListener('click', () => {
    const val = input?.value?.trim();
    if (val) runSearch(val);
  });

  /* Enter key */
  input?.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const val = input.value.trim();
      if (val) runSearch(val);
    }
  });

  /* Clear button */
  const clearBtn = document.getElementById('search-clear-1');
  clearBtn?.addEventListener('click', () => {
    if (input) input.value = '';
    clearBtn.classList.add('hidden');
    input?.focus();
  });

  /* Example pills */
  exPills?.addEventListener('click', e => {
    const pill = e.target.closest('[data-drug]');
    if (!pill) return;
    const drug = pill.dataset.drug;
    if (input) input.value = drug;
    runSearch(drug);
  });
}

/* ════════════════════════════════════════════════════════
   Tab 2 — Compare
   ════════════════════════════════════════════════════════ */
function initCompareTab() {
  const inputA   = document.getElementById('compare-input-a');
  const inputB   = document.getElementById('compare-input-b');
  const btn      = document.getElementById('compare-btn');
  const exPills  = document.getElementById('compare-examples');

  /* Autocomplete for both inputs */
  initAutocomplete('compare-input-a', 'autocomplete-list-a', name => {
    if (inputA) inputA.value = name;
  });
  initAutocomplete('compare-input-b', 'autocomplete-list-b', name => {
    if (inputB) inputB.value = name;
  });

  /* Compare button */
  btn?.addEventListener('click', () => {
    const a = inputA?.value?.trim();
    const b = inputB?.value?.trim();
    runCompare(a, b);
  });

  /* Enter on either input */
  [inputA, inputB].forEach(input => {
    input?.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const a = inputA?.value?.trim();
        const b = inputB?.value?.trim();
        runCompare(a, b);
      }
    });
  });

  /* Example pairs */
  exPills?.addEventListener('click', e => {
    const pill = e.target.closest('[data-drug-a]');
    if (!pill) return;
    const a = pill.dataset.drugA;
    const b = pill.dataset.drugB;
    if (inputA) inputA.value = a;
    if (inputB) inputB.value = b;
    runCompare(a, b);
  });
}

/* ════════════════════════════════════════════════════════
   Tab 3 — Recall Timeline
   ════════════════════════════════════════════════════════ */
function initTimelineTab() {
  const input  = document.getElementById('timeline-search-input');
  const btn    = document.getElementById('timeline-search-btn');
  const pills  = document.getElementById('example-pills-t');

  /* Autocomplete */
  initAutocomplete('timeline-search-input', 'autocomplete-list-t', name => {
    if (input) input.value = name;
    runTimeline(name);
  });

  /* Search button */
  btn?.addEventListener('click', () => {
    const val = input?.value?.trim();
    if (val) runTimeline(val);
  });

  /* Enter key */
  input?.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const val = input.value.trim();
      if (val) runTimeline(val);
    }
  });

  /* Example pills */
  pills?.addEventListener('click', e => {
    const pill = e.target.closest('[data-drug-timeline]');
    if (!pill) return;
    const drug = pill.dataset.drugTimeline;
    if (input) input.value = drug;
    runTimeline(drug);
  });
}

/* ════════════════════════════════════════════════════════
   Tab 4 — Drug Classes
   ════════════════════════════════════════════════════════ */
function initClassesTab() {
  initClassSelector();

  /* Auto-load default class on first visit to the tab */
  const tabBtn = document.querySelector('.tab-btn[data-tab="classes"]');
  let firstVisit = true;
  tabBtn?.addEventListener('click', () => {
    if (firstVisit) {
      firstVisit = false;
      loadClass(STATE.ui.activeClass);
    }
  });
}
