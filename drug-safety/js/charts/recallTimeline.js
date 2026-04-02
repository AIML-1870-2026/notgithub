/* ════════════════════════════════════════════════════════
   recallTimeline.js — D3 v7 swim-lane recall timeline
   Pure D3 wrapper, no app state imports.
   ════════════════════════════════════════════════════════ */

const LANES       = ['I', 'II', 'III'];
const CLASS_COLOR = {
  'I':   '#FF3B30',
  'II':  '#FF9500',
  'III': '#34C759',
};
const CLASS_LABEL = {
  'I':   'Class I',
  'II':  'Class II',
  'III': 'Class III',
};

/* ─────────────────────────────────────────────────────────
   renderRecallTimeline(svgId, data, tooltipId)
   data: [{date, product, reason, classLevel, status, firm}]
   ───────────────────────────────────────────────────────── */
export function renderRecallTimeline(svgId, data, tooltipId = 'd3-tooltip') {
  const svgEl = document.getElementById(svgId);
  if (!svgEl || !data?.length) return;

  // Clear previous render
  d3.select(svgEl).selectAll('*').remove();

  const container = svgEl.closest('.timeline-wrap') || svgEl.parentElement;
  const W          = (container?.clientWidth || 900) - 4;
  const margin     = { top: 20, right: 24, bottom: 52, left: 92 };
  const H          = 300;
  const iW         = W - margin.left - margin.right;
  const iH         = H - margin.top  - margin.bottom;

  const svg = d3.select(svgEl)
    .attr('width',  W)
    .attr('height', H)
    .attr('viewBox', `0 0 ${W} ${H}`);

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  /* ── Time scale ── */
  const dates   = data.map(d => d.date);
  const dateMin = d3.timeMonth.offset(d3.min(dates), -1);
  const dateMax = d3.timeMonth.offset(d3.max(dates),  1);

  const xScale = d3.scaleTime()
    .domain([dateMin, dateMax])
    .range([0, iW]);

  /* ── Lane scale ── */
  const laneScale = d3.scaleBand()
    .domain(LANES)
    .range([0, iH])
    .padding(0.25);

  const laneH = laneScale.bandwidth();
  const laneY = lane => laneScale(lane) + laneH / 2;

  /* ── Background lane bands ── */
  g.selectAll('.lane-band')
    .data(LANES)
    .join('rect')
    .attr('class', 'lane-band')
    .attr('x', 0)
    .attr('y', d => laneScale(d))
    .attr('width',  iW)
    .attr('height', laneH)
    .attr('fill',   d => CLASS_COLOR[d])
    .attr('rx', 6)
    .attr('opacity', 0.05);

  /* ── Center lines ── */
  g.selectAll('.lane-line')
    .data(LANES)
    .join('line')
    .attr('class', 'lane-line')
    .attr('x1', 0)
    .attr('x2', iW)
    .attr('y1', d => laneY(d))
    .attr('y2', d => laneY(d))
    .attr('stroke', d => CLASS_COLOR[d])
    .attr('stroke-width', 1)
    .attr('opacity', 0.2)
    .attr('stroke-dasharray', '4,4');

  /* ── Lane labels (left) ── */
  g.selectAll('.lane-label')
    .data(LANES)
    .join('text')
    .attr('class', 'lane-label')
    .attr('x', -10)
    .attr('y', d => laneY(d))
    .attr('text-anchor', 'end')
    .attr('dominant-baseline', 'middle')
    .attr('fill', d => CLASS_COLOR[d])
    .attr('font-size', 11)
    .attr('font-weight', '700')
    .attr('font-family', '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif')
    .text(d => CLASS_LABEL[d]);

  /* ── X axis ── */
  const totalMonths = d3.timeMonth.count(dateMin, dateMax);
  const tickInterval = totalMonths <= 12  ? d3.timeMonth.every(1)
                     : totalMonths <= 36  ? d3.timeMonth.every(3)
                     : totalMonths <= 72  ? d3.timeMonth.every(6)
                     : d3.timeYear.every(1);

  g.append('g')
    .attr('transform', `translate(0, ${iH})`)
    .call(
      d3.axisBottom(xScale)
        .ticks(tickInterval)
        .tickFormat(d3.timeFormat('%b %Y'))
        .tickSize(4)
    )
    .call(ax => ax.select('.domain').attr('stroke', 'rgba(0,0,0,0.12)'))
    .call(ax => ax.selectAll('.tick line').attr('stroke', 'rgba(0,0,0,0.12)'))
    .call(ax => ax.selectAll('.tick text')
      .attr('fill', '#6E6E73')
      .attr('font-size', 11)
      .attr('font-family', '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif')
    );

  /* ── Collision jitter: offset dots in same lane/date bucket ── */
  const bucketMap = new Map();
  data.forEach(d => {
    const key = `${d.date.getFullYear()}-${d.date.getMonth()}-${d.classLevel}`;
    if (!bucketMap.has(key)) bucketMap.set(key, []);
    bucketMap.get(key).push(d);
  });

  data.forEach(d => {
    const key    = `${d.date.getFullYear()}-${d.date.getMonth()}-${d.classLevel}`;
    const group  = bucketMap.get(key);
    d._groupIdx  = group.indexOf(d);
    d._groupSize = group.length;
  });

  /* ── Tooltip ── */
  const tooltip = document.getElementById(tooltipId);

  /* ── Event circles ── */
  const fmt = d3.timeFormat('%B %d, %Y');

  g.selectAll('.recall-dot')
    .data(data)
    .join('circle')
    .attr('class', 'recall-dot')
    .attr('cx', d => xScale(d.date))
    .attr('cy', d => {
      const base = laneY(d.classLevel);
      const jitter = d._groupSize > 1
        ? (d._groupIdx - (d._groupSize - 1) / 2) * 9
        : 0;
      return base + jitter;
    })
    .attr('r', 0)
    .attr('fill',         d => CLASS_COLOR[d.classLevel])
    .attr('stroke',       '#FFFFFF')
    .attr('stroke-width', 2)
    .attr('opacity',      0.88)
    .attr('cursor', 'pointer')
    .transition()
    .duration(400)
    .delay((_, i) => i * 18)
    .ease(d3.easeBackOut)
    .attr('r', 7);

  /* Add mouse events after transition via selection (not transition) */
  g.selectAll('.recall-dot')
    .on('mouseover', function(event, d) {
      d3.select(this)
        .raise()
        .transition().duration(120)
        .attr('r', 10)
        .attr('opacity', 1);

      if (!tooltip) return;
      tooltip.innerHTML = `
        <div style="font-weight:700;color:${CLASS_COLOR[d.classLevel]};margin-bottom:4px">
          ${CLASS_LABEL[d.classLevel]} Recall
        </div>
        <div><span style="color:#6E6E73">Date:</span> ${fmt(d.date)}</div>
        <div style="margin-top:4px"><span style="color:#6E6E73">Product:</span> ${d.product}</div>
        <div style="margin-top:4px"><span style="color:#6E6E73">Reason:</span> ${d.reason}</div>
        <div style="margin-top:4px"><span style="color:#6E6E73">Status:</span> ${d.status}</div>
        ${d.firm ? `<div style="margin-top:4px"><span style="color:#6E6E73">Firm:</span> ${d.firm}</div>` : ''}
      `;
      positionTooltip(tooltip, event);
    })
    .on('mousemove', function(event) {
      if (tooltip) positionTooltip(tooltip, event);
    })
    .on('mouseout', function() {
      d3.select(this)
        .transition().duration(120)
        .attr('r', 7)
        .attr('opacity', 0.88);
      if (tooltip) tooltip.classList.add('hidden');
    });
}

function positionTooltip(tooltip, event) {
  // Make visible off-screen first so we can measure actual rendered size
  tooltip.style.visibility = 'hidden';
  tooltip.style.left = '0px';
  tooltip.style.top  = '0px';
  tooltip.classList.remove('hidden');

  const TW = tooltip.offsetWidth  || 260;
  const TH = tooltip.offsetHeight || 120;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const MARGIN = 12;
  const OFFSET = 14;

  // Prefer right of cursor; flip left if it would overflow
  let x = event.clientX + OFFSET;
  if (x + TW + MARGIN > vw) {
    x = event.clientX - TW - OFFSET;
  }
  // Clamp so it never goes off the left edge either
  x = Math.max(MARGIN, x);

  // Prefer above cursor; flip below if it would overflow top
  let y = event.clientY - TH - OFFSET;
  if (y < MARGIN) {
    y = event.clientY + OFFSET;
  }
  // Clamp so it never goes off the bottom edge
  if (y + TH + MARGIN > vh) {
    y = vh - TH - MARGIN;
  }

  tooltip.style.left       = x + 'px';
  tooltip.style.top        = y + 'px';
  tooltip.style.visibility = '';
}
