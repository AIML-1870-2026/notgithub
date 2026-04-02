/* ════════════════════════════════════════════════════════
   state.js — Centralized application state
   All modules import and mutate this single object.
   ════════════════════════════════════════════════════════ */

export const STATE = {
  activeTab: 'search',

  data: {
    /* Tab 1 — Drug Search */
    searchDrug: null,
    /* shape: {
         name: string,
         events: [{ term, count }],
         totalEvents: number,
         recallCount: number,
         warnings: string[],
       } */

    /* Tab 2 — Compare */
    compareA: null,
    compareB: null,
    /* shape: { name, events: [{ term, count }], totalEvents } */

    /* Tab 3 — Timeline */
    timelineDrug: null,
    /* shape: {
         name: string,
         recalls: [{
           date: Date,
           product: string,
           reason: string,
           classLevel: 'I'|'II'|'III',
           status: string,
           firm: string,
         }]
       } */

    /* Tab 4 — Drug Classes */
    classProfile: null,
    /* shape: {
         classKey: string,
         className: string,
         drugs: string[],
         events: [{ term, count }],
         totalEvents: number,
       } */
  },

  loaded: {
    search:   false,
    compare:  false,
    timeline: false,
    classes:  false,
  },

  ui: {
    searchChart:       null,   // Chart.js instance
    classChart:        null,   // Chart.js instance
    activeClass:       'ssri',
    compareRendered:   false,
    timelineRendered:  false,
  },
};
