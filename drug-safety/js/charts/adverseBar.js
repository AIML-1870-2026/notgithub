/* ════════════════════════════════════════════════════════
   adverseBar.js — Chart.js horizontal bar chart
   Pure Chart.js wrapper, no app imports.
   ════════════════════════════════════════════════════════ */

/* Track Chart.js instances by canvasId to allow proper destruction */
const _instances = new Map();

/* ─────────────────────────────────────────────────────────
   renderAdverseBar(canvasId, data, options)
   data: [{ term: string, count: number }] sorted desc
   options: { color, title, drugName }
   Returns the Chart.js instance
   ───────────────────────────────────────────────────────── */
export function renderAdverseBar(canvasId, data, options = {}) {
  // Destroy existing instance to avoid "canvas already in use" error
  destroyChart(canvasId);

  const canvas = document.getElementById(canvasId);
  if (!canvas || !data?.length) return null;

  const {
    color    = '#007AFF',
    colorDim = 'rgba(0, 122, 255, 0.12)',
  } = options;

  const labels = data.map(d => d.term);
  const counts = data.map(d => d.count);
  const max    = Math.max(...counts);

  // Build gradient-like bar colors: full color for highest, dimming toward lowest
  const barColors = counts.map((c, i) => {
    const alpha = 0.3 + (c / max) * 0.7;
    return hexToRgba(color, alpha);
  });

  const chart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data:            counts,
        backgroundColor: barColors,
        borderColor:     barColors.map(c => c.replace(/[\d.]+\)$/, '1)')),
        borderWidth:     0,
        borderRadius:    6,
        borderSkipped:   false,
      }],
    },
    options: {
      indexAxis:   'y',   // horizontal bars
      responsive:  true,
      maintainAspectRatio: false,
      animation: {
        duration: 600,
        easing:   'easeOutQuart',
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(29, 29, 31, 0.92)',
          titleColor:      '#FFFFFF',
          bodyColor:       'rgba(255,255,255,0.75)',
          padding:         10,
          cornerRadius:    8,
          callbacks: {
            label: ctx => ` ${ctx.parsed.x.toLocaleString()} reports`,
          },
        },
      },
      scales: {
        x: {
          grid: {
            color:     'rgba(0,0,0,0.05)',
            drawBorder: false,
          },
          ticks: {
            color:    '#6E6E73',
            font:     { size: 12 },
            callback: v => v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v,
          },
          border: { display: false },
        },
        y: {
          grid:  { display: false },
          ticks: {
            color: '#1D1D1F',
            font:  { size: 13, weight: '500' },
          },
          border: { display: false },
        },
      },
      layout: {
        padding: { right: 12 },
      },
    },
  });

  _instances.set(canvasId, chart);
  return chart;
}

/* ─────────────────────────────────────────────────────────
   destroyChart(canvasId) — safely destroy a Chart.js instance
   ───────────────────────────────────────────────────────── */
export function destroyChart(canvasId) {
  if (_instances.has(canvasId)) {
    _instances.get(canvasId).destroy();
    _instances.delete(canvasId);
  }
}

/* ── Hex color → rgba() string helper ── */
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
}
