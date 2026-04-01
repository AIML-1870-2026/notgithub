/* ══════════════════════════════════════════════════════
   tabs/size.js — "Size Comparisons" tab
   Visualization: D3 proportional circles (area-scaled)
   Uses NeoWs data (fetched by today.js) — no extra API call.
══════════════════════════════════════════════════════ */

import { CONFIG }                  from '../config.js';
import { STATE }                   from '../state.js';
import { fmtNum, fmtInt, fmtDiam } from '../utils.js';

// ── Reference objects ─────────────────────────────────
// Diameters in meters — chosen to span human to planetary scale

const SIZE_REFERENCES = [
  { name: 'Adult Human',         diamM: 1.8,    icon: '🧍' },
  { name: 'School Bus',          diamM: 12,     icon: '🚌' },
  { name: 'Blue Whale',          diamM: 30,     icon: '🐋' },
  { name: 'Statue of Liberty',   diamM: 93,     icon: '🗽' },
  { name: 'Football Field',      diamM: 110,    icon: '🏈' },
  { name: 'Eiffel Tower',        diamM: 330,    icon: '🗼' },
  { name: 'Empire State Bldg',   diamM: 443,    icon: '🏢' },
  { name: 'Burj Khalifa',        diamM: 828,    icon: '🏙️' },
  { name: 'Mt. Everest',         diamM: 8849,   icon: '⛰️' },
  { name: 'Chicxulub impactor',  diamM: 10000,  icon: '☄️' },
  { name: 'Manhattan Island',    diamM: 21600,  icon: '🗺️' },
];

// ── Selector population ───────────────────────────────

export function populateSizeSelector() {
  const sel = document.getElementById('size-neo-select');
  if (!sel || !STATE.data.todayNeos.length) return;

  sel.innerHTML = STATE.data.todayNeos.map(neo =>
    `<option value="${neo.id}">${neo.name} (${fmtDiam(neo.diamAvgM)})</option>`
  ).join('');

  renderSizeTab(STATE.data.todayNeos[0]);
}

// ── Render ───────────────────────────────────────────

export function renderSizeTab(neo) {
  const stage  = document.getElementById('size-stage');
  const infoEl = document.getElementById('size-info');
  if (!stage || !neo) return;

  const neoDiam = neo.diamAvgM || 1;

  // Only show references within 3 orders of magnitude of the asteroid
  const refs = SIZE_REFERENCES.filter(r =>
    r.diamM >= neoDiam / 1000 && r.diamM <= neoDiam * 1000
  );

  const allItems = [
    { name: neo.name, diamM: neoDiam, isNeo: true, icon: '☄️', hazardous: neo.hazardous },
    ...refs,
  ].sort((a, b) => a.diamM - b.diamM);

  // Clear and re-create SVG
  stage.innerHTML = '<svg id="size-circles-svg"></svg>';
  const svgEl = document.getElementById('size-circles-svg');

  const containerW = stage.clientWidth  || 860;
  const LABEL_H    = 60;  // space below each circle for label
  const PAD_X      = 20;
  const PAD_TOP    = 30;

  // Radius scale: area-proportional (radius ∝ sqrt(diameter))
  // Map smallest item to minR, largest to maxR
  const diams  = allItems.map(i => i.diamM);
  const maxR   = Math.min(140, (containerW / allItems.length) * 0.38);
  const minR   = 8;

  const rScale = d3.scaleSqrt()
    .domain([d3.min(diams), d3.max(diams)])
    .range([minR, maxR]);

  // Calculate total width needed and derive SVG height
  const radii   = allItems.map(i => rScale(i.diamM));
  const maxCircR = Math.max(...radii);
  const SVG_H   = PAD_TOP + maxCircR * 2 + LABEL_H + 10;

  // Position circles along baseline; center each in its column slot
  const slotW = (containerW - PAD_X * 2) / allItems.length;

  const svg = d3.select(svgEl)
    .attr('width', containerW)
    .attr('height', SVG_H);

  const tooltip = document.getElementById('d3-tooltip');
  const baselineY = PAD_TOP + maxCircR * 2; // all circles sit on this y baseline

  // Defs for glow filter
  const defs = svg.append('defs');
  const filter = defs.append('filter').attr('id', 'neo-glow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
  filter.append('feGaussianBlur').attr('stdDeviation', 4).attr('result', 'blur');
  const feMerge = filter.append('feMerge');
  feMerge.append('feMergeNode').attr('in', 'blur');
  feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

  allItems.forEach((item, i) => {
    const r   = rScale(item.diamM);
    const cx  = PAD_X + slotW * i + slotW / 2;
    const cy  = baselineY - r; // sit on baseline

    const color = item.isNeo
      ? (item.hazardous ? CONFIG.HAZARD_COLOR : CONFIG.SAFE_COLOR)
      : '#4a5568';

    const g = svg.append('g').attr('cursor', 'default');

    // Glow ring for NEO
    if (item.isNeo) {
      g.append('circle')
        .attr('cx', cx).attr('cy', cy).attr('r', r + 6)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 1.5)
        .attr('opacity', 0.4)
        .attr('filter', 'url(#neo-glow)');
    }

    // Main circle
    g.append('circle')
      .attr('cx', cx).attr('cy', cy).attr('r', r)
      .attr('fill', item.isNeo ? color : '#2d3748')
      .attr('stroke', color)
      .attr('stroke-width', item.isNeo ? 2 : 1)
      .attr('opacity', item.isNeo ? 0.95 : 0.7)
      .on('mouseover', function(event) {
        d3.select(this).attr('opacity', 1);
        if (tooltip) {
          const label = item.diamM >= 1000
            ? fmtNum(item.diamM / 1000, 2) + ' km'
            : fmtInt(item.diamM) + ' m';
          tooltip.innerHTML = `
            <strong style="color:${color}">${item.icon} ${item.name}</strong><br/>
            <span style="color:#8892a4">Diameter: </span>${label}
            ${item.isNeo ? `<br/><span style="color:#8892a4">Status: </span>${item.hazardous ? '⚠ Potentially Hazardous' : '✓ Safe'}` : ''}
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
        d3.select(this).attr('opacity', item.isNeo ? 0.95 : 0.7);
        if (tooltip) tooltip.classList.add('hidden');
      });

    // Icon label
    g.append('text')
      .attr('x', cx).attr('y', baselineY + 16)
      .attr('text-anchor', 'middle')
      .attr('font-size', 14)
      .text(item.icon);

    // Name label
    g.append('text')
      .attr('x', cx).attr('y', baselineY + 32)
      .attr('text-anchor', 'middle')
      .attr('fill', item.isNeo ? color : '#8892a4')
      .attr('font-size', 9)
      .attr('font-family', 'system-ui, sans-serif')
      .attr('font-weight', item.isNeo ? 600 : 400)
      .text(item.isNeo
        ? item.name.replace(/^\(?\d{4}\s/, '').replace(/\)$/, '').slice(0, 14)
        : item.name.slice(0, 14));

    // Diameter label
    const diamLabel = item.diamM >= 1000
      ? fmtNum(item.diamM / 1000, 1) + ' km'
      : fmtInt(item.diamM) + ' m';

    g.append('text')
      .attr('x', cx).attr('y', baselineY + 44)
      .attr('text-anchor', 'middle')
      .attr('fill', '#4a5568')
      .attr('font-size', 8)
      .attr('font-family', 'system-ui, sans-serif')
      .text(diamLabel);
  });

  // Baseline
  svg.append('line')
    .attr('x1', PAD_X).attr('x2', containerW - PAD_X)
    .attr('y1', baselineY + 2).attr('y2', baselineY + 2)
    .attr('stroke', 'rgba(255,255,255,0.08)')
    .attr('stroke-width', 1);

  if (infoEl) {
    infoEl.textContent =
      `Estimated diameter: ${fmtDiam(neo.diamMinM)} – ${fmtDiam(neo.diamMaxM)} · ` +
      `Circle area is proportional to real cross-section · ` +
      `References within 3 orders of magnitude shown.`;
  }
}
