/* ══════════════════════════════════════════════════════
   tabs/hazard.js — "Hazard Rankings" tab
   Visualization: D3 bubble chart (Palermo Scale vs Probability)
   Data source: JPL Sentry API (no key required)
══════════════════════════════════════════════════════ */

import { CONFIG }                        from '../config.js';
import { STATE }                         from '../state.js';
import { fetchSentry }                   from '../api.js';
import { fmtNum, emptyState, showToast } from '../utils.js';

// ── Load ─────────────────────────────────────────────

export async function loadHazardData() {
  const listEl = document.getElementById('hazard-list');
  if (listEl) {
    listEl.innerHTML = Array.from({ length: 10 }, () => `
      <div class="hazard-row" aria-hidden="true">
        <div class="skeleton" style="height:14px;width:22px"></div>
        <div style="flex:1;display:flex;flex-direction:column;gap:5px">
          <div class="skeleton" style="height:14px;width:68%"></div>
          <div class="skeleton" style="height:10px;width:42%"></div>
        </div>
        <div class="skeleton" style="height:20px;width:48px"></div>
      </div>
    `).join('');
  }

  try {
    await fetchSentry();
    renderHazardTab();
  } catch (err) {
    console.error('[NEOWatch] Sentry fetch failed:', err);
    showToast('Failed to load Sentry hazard data.', 'error');
    if (listEl) {
      listEl.innerHTML = emptyState('⚠️', 'Sentry unavailable',
        'Could not reach the JPL Sentry API. Try again later.');
    }
  }
}

// ── Render ───────────────────────────────────────────

export function renderHazardTab() {
  const neos   = STATE.data.hazardNeos.slice(0, CONFIG.SENTRY_CHART_LIMIT);
  const listEl = document.getElementById('hazard-list');

  if (!listEl) return;

  if (!neos.length) {
    listEl.innerHTML = emptyState('🌕', 'No Sentry objects',
      'The Sentry dataset appears empty or unavailable.');
    return;
  }

  // Ranked list (unchanged)
  listEl.innerHTML = neos.map((neo, i) => {
    const isHigh = neo.psCum > -2;
    return `
      <div class="hazard-row">
        <span class="hazard-rank">${i + 1}</span>
        <div class="hazard-info">
          <span class="hazard-name" title="${neo.fullName}">${neo.fullName}</span>
          <span class="hazard-range">
            Impact window: ${neo.range} · ${neo.nImpacts.toLocaleString()} scenarios
          </span>
        </div>
        <div class="hazard-scores">
          <span class="ps-score"
                style="color:${isHigh ? 'var(--hazard)' : 'var(--text-primary)'}"
                title="Cumulative Palermo Scale">
            ${fmtNum(neo.psCum, 2)}
          </span>
          <span class="ts-badge" title="Torino Scale maximum">TS ${neo.tsMax}</span>
        </div>
      </div>
    `;
  }).join('');

  renderHazardBubbleChart(neos);
}

// ── D3 Bubble Chart ───────────────────────────────────

function renderHazardBubbleChart(neos) {
  const svgEl = document.getElementById('hazard-bubble-svg');
  if (!svgEl) return;

  while (svgEl.firstChild) svgEl.removeChild(svgEl.firstChild);

  const container = svgEl.parentElement;
  const W  = container ? container.clientWidth  || 480 : 480;
  const H  = container ? container.clientHeight || 340 : 340;

  const margin = { top: 28, right: 24, bottom: 52, left: 64 };
  const iW = W - margin.left - margin.right;
  const iH = H - margin.top  - margin.bottom;

  const svg = d3.select(svgEl)
    .attr('width', W)
    .attr('height', H);

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // ── Scales ────────────────────────────────────────────
  const psValues = neos.map(n => n.psCum);
  const psMin    = Math.min(...psValues) - 0.5;
  const psMax    = Math.max(...psValues) + 0.5;

  const xScale = d3.scaleLinear()
    .domain([psMin, psMax])
    .range([0, iW]);

  // Y: impact probability (log scale); fallback to tiny value if 0
  const probValues = neos.map(n => Math.max(n.probability || 1e-10, 1e-10));
  const yScale = d3.scaleLog()
    .domain([d3.min(probValues) / 2, d3.max(probValues) * 3])
    .range([iH, 0])
    .clamp(true);

  // Bubble size: sqrt(nImpacts) normalized to 6–24px radius
  const impactExtent = d3.extent(neos, n => n.nImpacts || 1);
  const rScale = d3.scaleSqrt()
    .domain(impactExtent)
    .range([6, 22]);

  // ── Grid lines ────────────────────────────────────────
  g.append('g')
    .attr('class', 'grid')
    .call(d3.axisLeft(yScale)
      .ticks(5)
      .tickSize(-iW)
      .tickFormat('')
    )
    .call(gr => {
      gr.selectAll('line').attr('stroke', 'rgba(255,255,255,0.05)');
      gr.select('.domain').remove();
    });

  g.append('g')
    .attr('class', 'grid')
    .attr('transform', `translate(0,${iH})`)
    .call(d3.axisBottom(xScale)
      .ticks(5)
      .tickSize(-iH)
      .tickFormat('')
    )
    .call(gr => {
      gr.selectAll('line').attr('stroke', 'rgba(255,255,255,0.05)');
      gr.select('.domain').remove();
    });

  // ── Reference line at PS = −2 ─────────────────────────
  if (psMin < -2 && psMax > -2) {
    const refX = xScale(-2);
    g.append('line')
      .attr('x1', refX).attr('x2', refX)
      .attr('y1', 0).attr('y2', iH)
      .attr('stroke', '#ff4757')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '5 3')
      .attr('opacity', 0.5);

    g.append('text')
      .attr('x', refX + 4)
      .attr('y', 12)
      .attr('fill', '#ff4757')
      .attr('font-size', 9)
      .attr('font-family', 'system-ui, sans-serif')
      .attr('opacity', 0.7)
      .text('PS = −2');
  }

  // ── Axes ─────────────────────────────────────────────
  const axisStyle = sel => sel
    .call(ax => ax.select('.domain').attr('stroke', 'rgba(255,255,255,0.15)'))
    .call(ax => ax.selectAll('tick line').attr('stroke', 'rgba(255,255,255,0.15)'))
    .call(ax => ax.selectAll('text').attr('fill', '#8892a4').attr('font-size', 10).attr('font-family', 'system-ui, sans-serif'));

  g.append('g')
    .attr('transform', `translate(0,${iH})`)
    .call(d3.axisBottom(xScale).ticks(6).tickFormat(d => d.toFixed(1)))
    .call(axisStyle);

  g.append('g')
    .call(d3.axisLeft(yScale).ticks(5, '.0e'))
    .call(axisStyle);

  // Axis labels
  g.append('text')
    .attr('x', iW / 2).attr('y', iH + 44)
    .attr('text-anchor', 'middle')
    .attr('fill', '#4a5568').attr('font-size', 11).attr('font-family', 'system-ui, sans-serif')
    .text('Cumulative Palermo Scale');

  g.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -iH / 2).attr('y', -52)
    .attr('text-anchor', 'middle')
    .attr('fill', '#4a5568').attr('font-size', 11).attr('font-family', 'system-ui, sans-serif')
    .text('Impact Probability');

  // ── Bubbles ───────────────────────────────────────────
  const tooltip = document.getElementById('d3-tooltip');

  g.selectAll('.bubble')
    .data(neos)
    .join('circle')
      .attr('class', 'bubble')
      .attr('cx', d => xScale(d.psCum))
      .attr('cy', d => yScale(Math.max(d.probability || 1e-10, 1e-10)))
      .attr('r',  d => rScale(d.nImpacts || 1))
      .attr('fill', d => d.psCum > -2 ? 'rgba(255,71,87,0.65)' : 'rgba(0,212,255,0.50)')
      .attr('stroke', d => d.psCum > -2 ? '#ff4757' : '#00d4ff')
      .attr('stroke-width', 1.2)
      .attr('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this).attr('opacity', 1).attr('stroke-width', 2);
        if (tooltip) {
          tooltip.innerHTML = `
            <strong style="color:${d.psCum > -2 ? '#ff4757' : '#00d4ff'}">${d.fullName}</strong><br/>
            <span style="color:#8892a4">Palermo Scale: </span>${fmtNum(d.psCum, 2)}<br/>
            <span style="color:#8892a4">Probability: </span>${(d.probability * 100).toExponential(2)}%<br/>
            <span style="color:#8892a4">Impact window: </span>${d.range}<br/>
            <span style="color:#8892a4">Scenarios: </span>${d.nImpacts.toLocaleString()}
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
        d3.select(this).attr('opacity', null).attr('stroke-width', 1.2);
        if (tooltip) tooltip.classList.add('hidden');
      });

  // Bubble size legend
  const legendR = [impactExtent[0], Math.round((impactExtent[0] + impactExtent[1]) / 2), impactExtent[1]];
  const legendG = g.append('g').attr('transform', `translate(${iW - 80}, 8)`);
  legendG.append('text').attr('x', 0).attr('y', 0)
    .attr('fill', '#4a5568').attr('font-size', 9).attr('font-family', 'system-ui, sans-serif')
    .text('Bubble = scenarios');

  legendR.forEach((val, i) => {
    const r = rScale(val);
    legendG.append('circle')
      .attr('cx', 10 + i * 30).attr('cy', 18)
      .attr('r', r)
      .attr('fill', 'none')
      .attr('stroke', '#4a5568')
      .attr('stroke-width', 0.8);
    legendG.append('text')
      .attr('x', 10 + i * 30).attr('cy', 32).attr('y', 18 + r + 10)
      .attr('text-anchor', 'middle')
      .attr('fill', '#4a5568').attr('font-size', 8).attr('font-family', 'system-ui, sans-serif')
      .text(val.toLocaleString());
  });
}
