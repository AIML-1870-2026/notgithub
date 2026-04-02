/* ════════════════════════════════════════════════════════
   compareChart.js — D3 v7 grouped horizontal bar chart
   Compares two drugs' top adverse reactions side by side.
   Pure D3 wrapper, no app state imports.
   ════════════════════════════════════════════════════════ */

const COLOR_A = '#007AFF';
const COLOR_B = '#FF9500';

/* ─────────────────────────────────────────────────────────
   renderCompareChart(svgId, dataA, dataB, nameA, nameB)
   dataA/dataB: [{term, count}] sorted desc
   ───────────────────────────────────────────────────────── */
export function renderCompareChart(svgId, dataA, dataB, nameA, nameB) {
  const svgEl = document.getElementById(svgId);
  if (!svgEl) return;

  d3.select(svgEl).selectAll('*').remove();

  /* Merge terms: union of top terms from both drugs */
  const allTerms = mergeTopTerms(dataA, dataB, 10);
  const mapA     = new Map(dataA.map(d => [d.term, d.count]));
  const mapB     = new Map(dataB.map(d => [d.term, d.count]));

  const container = svgEl.parentElement;
  const W    = Math.max(container?.clientWidth || 700, 400);
  const BAND = 38;   // height per term group
  const GAP  = 6;    // gap between paired bars
  const H_CONTENT = allTerms.length * (BAND * 2 + GAP + 12) + 20;

  const margin = { top: 10, right: 20, bottom: 40, left: 170 };
  const iW = W - margin.left - margin.right;
  const H  = H_CONTENT + margin.top + margin.bottom;

  const svg = d3.select(svgEl)
    .attr('width',   W)
    .attr('height',  H)
    .attr('viewBox', `0 0 ${W} ${H}`);

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  /* ── X scale ── */
  const maxCount = d3.max([
    ...dataA.map(d => d.count),
    ...dataB.map(d => d.count),
  ]) || 1;

  const xScale = d3.scaleLinear()
    .domain([0, maxCount * 1.08])
    .range([0, iW])
    .nice();

  /* ── X Axis ── */
  g.append('g')
    .attr('transform', `translate(0, ${H - margin.top - margin.bottom})`)
    .call(
      d3.axisBottom(xScale)
        .ticks(6)
        .tickFormat(v => v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v)
        .tickSize(4)
    )
    .call(ax => ax.select('.domain').remove())
    .call(ax => ax.selectAll('.tick line').attr('stroke', 'rgba(0,0,0,0.12)'))
    .call(ax => ax.selectAll('.tick text')
      .attr('fill', '#6E6E73')
      .attr('font-size', 11)
      .attr('font-family', '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif')
    );

  /* ── Grid lines ── */
  g.append('g')
    .attr('class', 'grid')
    .call(
      d3.axisBottom(xScale)
        .ticks(6)
        .tickSize(-(H - margin.top - margin.bottom))
        .tickFormat('')
    )
    .call(ax => ax.select('.domain').remove())
    .call(ax => ax.selectAll('.tick line')
      .attr('stroke', 'rgba(0,0,0,0.04)')
      .attr('stroke-dasharray', '3,3')
    );

  /* ── Term groups ── */
  allTerms.forEach((term, i) => {
    const y0      = i * (BAND * 2 + GAP + 12);
    const countA  = mapA.get(term) ?? 0;
    const countB  = mapB.get(term) ?? 0;

    /* Term label */
    g.append('text')
      .attr('x', -10)
      .attr('y', y0 + BAND)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#1D1D1F')
      .attr('font-size', 12)
      .attr('font-weight', '500')
      .attr('font-family', '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif')
      .text(truncate(term, 22));

    /* Drug A bar */
    g.append('rect')
      .attr('x', 0)
      .attr('y', y0)
      .attr('width', 0)
      .attr('height', BAND - 4)
      .attr('rx', 5)
      .attr('fill', COLOR_A)
      .attr('opacity', 0.8)
      .transition().duration(500).delay(i * 30)
      .attr('width', xScale(countA));

    /* Drug A count label */
    g.append('text')
      .attr('x', xScale(countA) + 5)
      .attr('y', y0 + (BAND - 4) / 2)
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#6E6E73')
      .attr('font-size', 11)
      .attr('font-family', '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif')
      .text(countA > 0 ? countA.toLocaleString() : '—');

    /* Drug B bar */
    g.append('rect')
      .attr('x', 0)
      .attr('y', y0 + BAND + GAP)
      .attr('width', 0)
      .attr('height', BAND - 4)
      .attr('rx', 5)
      .attr('fill', COLOR_B)
      .attr('opacity', 0.8)
      .transition().duration(500).delay(i * 30 + 60)
      .attr('width', xScale(countB));

    /* Drug B count label */
    g.append('text')
      .attr('x', xScale(countB) + 5)
      .attr('y', y0 + BAND + GAP + (BAND - 4) / 2)
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#6E6E73')
      .attr('font-size', 11)
      .attr('font-family', '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif')
      .text(countB > 0 ? countB.toLocaleString() : '—');
  });
}

/* ── Merge + rank top N terms from two datasets ── */
function mergeTopTerms(dataA, dataB, n) {
  const termsA = new Set(dataA.map(d => d.term));
  const termsB = new Set(dataB.map(d => d.term));
  const all    = new Set([...termsA, ...termsB]);

  const mapA = new Map(dataA.map(d => [d.term, d.count]));
  const mapB = new Map(dataB.map(d => [d.term, d.count]));

  return [...all]
    .map(term => ({
      term,
      combined: (mapA.get(term) ?? 0) + (mapB.get(term) ?? 0),
    }))
    .sort((a, b) => b.combined - a.combined)
    .slice(0, n)
    .map(d => d.term);
}

function truncate(str, len) {
  return str.length <= len ? str : str.slice(0, len - 1) + '…';
}

/* ── Legend data for external use ── */
export const COMPARE_COLORS = { A: COLOR_A, B: COLOR_B };
