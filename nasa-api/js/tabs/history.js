/* ══════════════════════════════════════════════════════
   tabs/history.js — "Historical Timeline" tab
   Visualization: D3 scatter plot (Date vs Miss Distance)
   Data source: JPL SBDB Close-Approach Data API (no key)
══════════════════════════════════════════════════════ */

import { CONFIG }                              from '../config.js';
import { STATE }                               from '../state.js';
import { fetchCAD }                            from '../api.js';
import { fmtNum, fmtAU, fmtInt, formatCADDate,
         emptyState, showToast,
         renderTimelineSkeletons }             from '../utils.js';

// ── Load ─────────────────────────────────────────────

export async function loadHistoryData(page = 0) {
  STATE.ui.historyPage = page;
  renderTimelineSkeletons(8);

  try {
    await fetchCAD(page);
    renderHistoryTab();
    renderHistoryPagination();
  } catch (err) {
    console.error('[NEOWatch] CAD fetch failed:', err);
    showToast('Failed to load historical close approach data.', 'error');
    const el = document.getElementById('history-timeline');
    if (el) el.innerHTML = `<div style="padding:48px 0">
      ${emptyState('🔭', 'Data unavailable', 'Could not reach the JPL SBDB API.')}
    </div>`;
  }
}

// ── D3 Scatter Plot ───────────────────────────────────

export function renderHistoryTab() {
  const entries = STATE.data.historyNeos;

  // Always target the SVG element directly — don't wipe the container
  // (the container innerHTML is also used by renderTimelineSkeletons)
  let svgEl = document.getElementById('history-scatter-svg');
  if (!svgEl) {
    // Re-create if it was wiped by the skeleton loader
    const container = document.getElementById('history-timeline');
    if (!container) return;
    container.innerHTML = '';
    svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgEl.id = 'history-scatter-svg';
    container.appendChild(svgEl);
  }

  // Clear previous chart contents
  while (svgEl.firstChild) svgEl.removeChild(svgEl.firstChild);

  if (!entries.length) {
    const container = document.getElementById('history-timeline');
    if (container) container.innerHTML = `<div style="padding:48px 0">
      ${emptyState('🔭', 'No results found',
        'Try adjusting your search term or date range.')}
    </div>`;
    return;
  }

  // Use the tab panel's width/height now that it is visible
  const panel = document.getElementById('tab-history');
  const W = (panel?.clientWidth  || svgEl.parentElement?.clientWidth  || 900) - 32;
  const H = Math.max(360, Math.min(520, window.innerHeight - 340));
  const margin = { top: 28, right: 28, bottom: 56, left: 72 };
  const iW = W - margin.left - margin.right;
  const iH = H - margin.top  - margin.bottom;

  const MOON_AU = CONFIG.MOON_ORBIT_AU;

  // JPL CAD dates are "2026-Mar-25 02:07" — month abbreviations are not
  // valid ISO 8601 so new Date() fails. Map them to numeric months manually.
  const MONTH_MAP = { Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5,
                      Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11 };
  function parseCADDate(str) {
    if (!str) return new Date(NaN);
    const m = str.match(/^(\d{4})-(\w{3})-(\d{2})/);
    if (!m) return new Date(NaN);
    const month = MONTH_MAP[m[2]];
    if (month === undefined) return new Date(NaN);
    return new Date(Date.UTC(+m[1], month, +m[3]));
  }

  const parsed = entries.map(e => ({
    ...e,
    dateObj: parseCADDate(e.date),
    ldDist:  e.distAU / MOON_AU,
  })).filter(e => !isNaN(e.dateObj));

  const svg = d3.select(svgEl)
    .attr('width', W)
    .attr('height', H);

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // ── Scales ────────────────────────────────────────────
  const xScale = d3.scaleTime()
    .domain(d3.extent(parsed, d => d.dateObj))
    .range([0, iW])
    .nice();

  const maxLD = d3.max(parsed, d => d.ldDist) * 1.3;
  const minLD = Math.max(0.05, d3.min(parsed, d => d.ldDist) * 0.7);

  const yScale = d3.scaleLog()
    .domain([minLD, maxLD])
    .range([iH, 0])
    .clamp(true);

  // Color: bright cyan = very close, fades to grey for far
  const colorScale = d3.scaleSequentialLog()
    .domain([maxLD, 0.1])
    .interpolator(d3.interpolateRgb('#2d3748', '#00d4ff'))
    .clamp(true);

  // ── Grid lines ────────────────────────────────────────
  g.append('g')
    .call(d3.axisLeft(yScale).ticks(5).tickSize(-iW).tickFormat(''))
    .call(gr => {
      gr.selectAll('line').attr('stroke', 'rgba(255,255,255,0.05)');
      gr.select('.domain').remove();
    });

  g.append('g')
    .attr('transform', `translate(0,${iH})`)
    .call(d3.axisBottom(xScale).ticks(6).tickSize(-iH).tickFormat(''))
    .call(gr => {
      gr.selectAll('line').attr('stroke', 'rgba(255,255,255,0.05)');
      gr.select('.domain').remove();
    });

  // ── Reference lines ───────────────────────────────────
  [[1, 'Moon orbit (1 LD)', '#8892a4'], [5, '5 LD', '#4a5568']].forEach(([ld, label, color]) => {
    const y = yScale(ld);
    if (y >= 0 && y <= iH) {
      g.append('line')
        .attr('x1', 0).attr('x2', iW)
        .attr('y1', y).attr('y2', y)
        .attr('stroke', color)
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '5 4')
        .attr('opacity', 0.5);
      g.append('text')
        .attr('x', 4).attr('y', y - 4)
        .attr('fill', color)
        .attr('font-size', 9)
        .attr('font-family', 'system-ui, sans-serif')
        .text(label);
    }
  });

  // ── Axes ─────────────────────────────────────────────
  const axisStyle = sel => sel
    .call(ax => ax.select('.domain').attr('stroke', 'rgba(255,255,255,0.15)'))
    .call(ax => ax.selectAll('.tick line').attr('stroke', 'rgba(255,255,255,0.15)'))
    .call(ax => ax.selectAll('text').attr('fill', '#8892a4').attr('font-size', 10).attr('font-family', 'system-ui, sans-serif'));

  g.append('g')
    .attr('transform', `translate(0,${iH})`)
    .call(d3.axisBottom(xScale).ticks(7))
    .call(axisStyle);

  g.append('g')
    .call(d3.axisLeft(yScale).ticks(5, '.1f').tickFormat(d => `${d.toFixed(1)} LD`))
    .call(axisStyle);

  // Axis labels
  g.append('text')
    .attr('x', iW / 2).attr('y', iH + 48)
    .attr('text-anchor', 'middle')
    .attr('fill', '#4a5568').attr('font-size', 11).attr('font-family', 'system-ui, sans-serif')
    .text('Close Approach Date');

  g.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -iH / 2).attr('y', -58)
    .attr('text-anchor', 'middle')
    .attr('fill', '#4a5568').attr('font-size', 11).attr('font-family', 'system-ui, sans-serif')
    .text('Miss Distance (Lunar Distances)');

  // ── Dots ──────────────────────────────────────────────
  const tooltip = document.getElementById('d3-tooltip');

  g.selectAll('.scatter-dot')
    .data(parsed)
    .join('circle')
      .attr('class', 'scatter-dot')
      .attr('cx', d => xScale(d.dateObj))
      .attr('cy', d => yScale(d.ldDist))
      .attr('r', 5)
      .attr('fill', d => colorScale(d.ldDist))
      .attr('stroke', d => d.ldDist < 1 ? '#00d4ff' : 'transparent')
      .attr('stroke-width', 1.2)
      .attr('opacity', 0.85)
      .attr('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this).attr('r', 7).attr('opacity', 1);
        if (tooltip) {
          const kmLabel = fmtInt(d.distAU * 149_597_870.7) + ' km';
          tooltip.innerHTML = `
            <strong style="color:#00d4ff">${d.designation}</strong><br/>
            <span style="color:#8892a4">Date: </span>${formatCADDate(d.date)}<br/>
            <span style="color:#8892a4">Distance: </span>${fmtNum(d.ldDist, 2)} LD  (${kmLabel})<br/>
            ${d.velRelKmS ? `<span style="color:#8892a4">Velocity: </span>${fmtNum(d.velRelKmS, 1)} km/s<br/>` : ''}
            ${d.magnitude ? `<span style="color:#8892a4">Magnitude: </span>${fmtNum(d.magnitude, 1)}` : ''}
          `;
          tooltip.classList.remove('hidden');
          tooltip.style.left = (event.pageX + 12) + 'px';
          tooltip.style.top  = (event.pageY - 20) + 'px';
        }
      })
      .on('mousemove', function(event) {
        if (tooltip) {
          tooltip.style.left = (event.pageX + 12) + 'px';
          tooltip.style.top  = (event.pageY - 20) + 'px';
        }
      })
      .on('mouseout', function() {
        d3.select(this).attr('r', 5).attr('opacity', 0.85);
        if (tooltip) tooltip.classList.add('hidden');
      });
}

// ── Pagination ────────────────────────────────────────

export function renderHistoryPagination() {
  const el    = document.getElementById('history-pagination');
  if (!el) return;

  const page  = STATE.ui.historyPage;
  const pages = Math.ceil(STATE.data.historyTotal / CONFIG.CAD_PAGE_SIZE);

  if (pages <= 1) { el.innerHTML = ''; return; }

  el.innerHTML = `
    <button class="page-btn" id="page-prev" ${page === 0 ? 'disabled' : ''}>
      ← Prev
    </button>
    <span class="page-info">Page ${(page + 1).toLocaleString()} of ${pages.toLocaleString()}</span>
    <button class="page-btn" id="page-next" ${page >= pages - 1 ? 'disabled' : ''}>
      Next →
    </button>
  `;

  document.getElementById('page-prev')
    ?.addEventListener('click', () => loadHistoryData(page - 1));
  document.getElementById('page-next')
    ?.addEventListener('click', () => loadHistoryData(page + 1));
}
