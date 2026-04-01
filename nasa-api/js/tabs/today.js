/* ══════════════════════════════════════════════════════
   tabs/today.js — "Today's Approaches" tab
   Visualization: D3 orbital proximity diagram
   Data source: NASA NeoWs API (7-day feed)
══════════════════════════════════════════════════════ */

import { CONFIG }                               from '../config.js';
import { STATE }                                from '../state.js';
import { fetchNeoFeed }                         from '../api.js';
import { updateGlobePoints }                    from '../globe.js';
import { fmtNum, fmtLD, fmtAU, fmtDiam,
         cardDateStr, emptyState,
         showToast, renderSkeletons }           from '../utils.js';
import { populateSizeSelector }                 from './size.js';

// ── Load ─────────────────────────────────────────────

export async function loadTodayData() {
  const wrap = document.getElementById('today-orbit-wrap');
  if (wrap) wrap.innerHTML = '<svg id="today-orbit-svg"></svg>';

  try {
    await fetchNeoFeed();
    renderTodayTab();
    renderTodayStats();
    populateSizeSelector();
    if (STATE.ui.globeInstance) {
      updateGlobePoints(STATE.data.todayNeos);
    }
  } catch (err) {
    console.error('[NEOWatch] NeoWs fetch failed:', err);
    showToast('Failed to load close approach data. Check your API key in js/config.js.', 'error');
    const wrap = document.getElementById('today-orbit-wrap');
    if (wrap) wrap.innerHTML = emptyState(
      '🛸', 'No data available',
      'Could not reach the NASA NeoWs API. Check your API key in js/config.js.'
    );
  }
}

// ── Stats chips ──────────────────────────────────────

export function renderTodayStats() {
  const neos    = STATE.data.todayNeos;
  const total   = neos.length;
  const haz     = neos.filter(n => n.hazardous).length;
  const closest = neos.reduce((min, n) => (n.distAU < min ? n.distAU : min), Infinity);

  const el = document.getElementById('today-stats');
  if (!el) return;

  el.innerHTML = `
    <div class="stat-chip">
      <span class="stat-chip-value accent">${total}</span>
      <span class="stat-chip-label">Total Objects</span>
    </div>
    <div class="stat-chip">
      <span class="stat-chip-value danger">${haz}</span>
      <span class="stat-chip-label">Hazardous</span>
    </div>
    <div class="stat-chip">
      <span class="stat-chip-value">${isFinite(closest) ? fmtLD(closest) : '—'}</span>
      <span class="stat-chip-label">Closest Pass</span>
    </div>
  `;
}

// ── D3 Orbital Proximity Diagram ─────────────────────

export function renderTodayTab() {
  let neos = [...STATE.data.todayNeos];
  const { hazardousOnly, sortBy } = STATE.ui.todayFilter;

  if (hazardousOnly) neos = neos.filter(n => n.hazardous);

  const sortFns = {
    date: (a, b) => a.dateMs - b.dateMs,
    dist: (a, b) => a.distAU - b.distAU,
    size: (a, b) => b.diamAvgM - a.diamAvgM,
    vel:  (a, b) => b.velKmS - a.velKmS,
  };
  neos.sort(sortFns[sortBy] ?? sortFns.date);

  const svgEl = document.getElementById('today-orbit-svg');
  if (!svgEl) return;

  // Clear previous render
  while (svgEl.firstChild) svgEl.removeChild(svgEl.firstChild);

  if (!neos.length) {
    const wrap = document.getElementById('today-orbit-wrap');
    if (wrap) wrap.innerHTML = emptyState(
      '🌑', 'No objects found',
      hazardousOnly
        ? 'No hazardous objects pass Earth in the next 7 days.'
        : 'No close approaches found for this window.'
    );
    return;
  }

  const container = document.getElementById('today-orbit-wrap');
  const W = container ? container.clientWidth  || 700 : 700;
  const H = container ? container.clientHeight || 520 : 520;
  const cx = W / 2;
  const cy = H / 2;

  const svg = d3.select(svgEl)
    .attr('width', W)
    .attr('height', H);

  // ── Ring distances in Lunar Distances ───────────────
  const MOON_AU = CONFIG.MOON_ORBIT_AU; // 0.00257 AU
  const rings = [1, 5, 10, 20, 40];    // LD values
  const maxLD = 50;
  const earthR = Math.min(W, H) * 0.04;
  const maxR   = Math.min(cx, cy) - 20;

  const rScale = d3.scaleLog()
    .domain([0.3, maxLD])
    .range([earthR + 12, maxR])
    .clamp(true);

  // ── Starfield background ─────────────────────────────
  const starCount = 120;
  const stars = d3.range(starCount).map(() => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: Math.random() * 1.2 + 0.3,
    o: Math.random() * 0.6 + 0.2,
  }));
  svg.append('g').attr('class', 'starfield')
    .selectAll('circle')
    .data(stars)
    .join('circle')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r',  d => d.r)
      .attr('fill', '#ffffff')
      .attr('opacity', d => d.o);

  // ── Distance rings ───────────────────────────────────
  const ringG = svg.append('g').attr('transform', `translate(${cx},${cy})`);

  rings.forEach(ld => {
    const r = rScale(ld);
    ringG.append('circle')
      .attr('r', r)
      .attr('fill', 'none')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 0.5)
      .attr('stroke-dasharray', '4 6')
      .attr('opacity', 0.18);

    ringG.append('text')
      .attr('x', r + 4)
      .attr('y', -4)
      .attr('fill', '#4a5568')
      .attr('font-size', 10)
      .attr('font-family', 'system-ui, sans-serif')
      .text(`${ld} LD`);
  });

  // Moon orbit label
  ringG.append('text')
    .attr('x', rScale(1) + 4)
    .attr('y', 12)
    .attr('fill', '#4a5568')
    .attr('font-size', 9)
    .attr('font-family', 'system-ui, sans-serif')
    .text('Moon');

  // ── Earth ────────────────────────────────────────────
  const earthG = ringG.append('g');

  // Atmosphere glow
  const glow = svg.append('defs').append('radialGradient')
    .attr('id', 'earth-glow')
    .attr('cx', '50%').attr('cy', '50%').attr('r', '50%');
  glow.append('stop').attr('offset', '60%').attr('stop-color', '#1a6dff').attr('stop-opacity', 0.5);
  glow.append('stop').attr('offset', '100%').attr('stop-color', '#1a6dff').attr('stop-opacity', 0);

  earthG.append('circle')
    .attr('r', earthR * 1.6)
    .attr('fill', 'url(#earth-glow)')
    .attr('opacity', 0.6);

  earthG.append('circle')
    .attr('r', earthR)
    .attr('fill', '#1a6dff');

  earthG.append('text')
    .attr('y', earthR + 14)
    .attr('text-anchor', 'middle')
    .attr('fill', '#8892a4')
    .attr('font-size', 10)
    .attr('font-family', 'system-ui, sans-serif')
    .text('Earth');

  // ── Asteroid dots ─────────────────────────────────────
  // Spread evenly by angle; sort by date so angular order = time order
  const angleStep = (2 * Math.PI) / neos.length;

  const tooltip = document.getElementById('d3-tooltip');

  const dotG = svg.append('g').attr('transform', `translate(${cx},${cy})`);

  neos.forEach((neo, i) => {
    const ldDist = neo.distAU / MOON_AU;
    const r      = rScale(Math.max(0.3, ldDist));
    const angle  = i * angleStep - Math.PI / 2; // start at top
    const dx     = r * Math.cos(angle);
    const dy     = r * Math.sin(angle);

    // Dot size: proportional to diameter (clamped 4–14px radius)
    const dotR = Math.max(4, Math.min(14, Math.sqrt(neo.diamAvgM || 50) * 0.5));
    const color = neo.hazardous ? CONFIG.HAZARD_COLOR : CONFIG.SAFE_COLOR;

    const g = dotG.append('g')
      .attr('transform', `translate(${dx},${dy})`)
      .attr('cursor', 'pointer');

    // Pulse ring for hazardous
    if (neo.hazardous) {
      g.append('circle')
        .attr('r', dotR + 5)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 1)
        .attr('opacity', 0.35);
    }

    g.append('circle')
      .attr('r', dotR)
      .attr('fill', color)
      .attr('opacity', 0.9)
      .on('mouseover', function(event) {
        d3.select(this).attr('opacity', 1).attr('r', dotR + 2);
        if (tooltip) {
          tooltip.innerHTML = `
            <strong style="color:${color}">${neo.name}</strong><br/>
            <span style="color:#8892a4">Date: </span>${cardDateStr(neo.date)}<br/>
            <span style="color:#8892a4">Distance: </span>${fmtLD(neo.distAU)}<br/>
            <span style="color:#8892a4">Speed: </span>${fmtNum(neo.velKmS, 1)} km/s<br/>
            <span style="color:#8892a4">Diameter: </span>~${fmtDiam(neo.diamAvgM)}
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
        d3.select(this).attr('opacity', 0.9).attr('r', dotR);
        if (tooltip) tooltip.classList.add('hidden');
      });

    // Label for closer objects (< 10 LD)
    if (ldDist < 10) {
      g.append('text')
        .attr('x', dotR + 5)
        .attr('y', 4)
        .attr('fill', color)
        .attr('font-size', 9)
        .attr('font-family', 'system-ui, sans-serif')
        .attr('opacity', 0.85)
        .text(neo.name.replace(/^\(?\d{4}\s/, '').replace(/\)$/, ''));
    }
  });
}
