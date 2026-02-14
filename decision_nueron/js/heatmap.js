// ============================================================
// Heatmap Visualizer (Stretch 2)
// ============================================================

$('heatmapX').addEventListener('change', (e) => { state.heatmapAxisX = parseInt(e.target.value); updateAll(); });
$('heatmapY').addEventListener('change', (e) => { state.heatmapAxisY = parseInt(e.target.value); updateAll(); });

function drawHeatmap() {
  const { w, h, ctx } = resizeCanvas(heatmapCanvas, 450);
  const sc = getScenario();
  const pad = 50;
  const plotW = w - pad * 2;
  const plotH = h - pad * 2;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#1c1c21';
  ctx.fillRect(0, 0, w, h);

  const axX = state.heatmapAxisX;
  const axY = state.heatmapAxisY;
  const resolution = 60;
  const cellW = plotW / resolution;
  const cellH = plotH / resolution;

  for (let ix = 0; ix < resolution; ix++) {
    for (let iy = 0; iy < resolution; iy++) {
      const nx = ix / (resolution - 1);
      const ny = 1 - iy / (resolution - 1);
      let z = state.bias;
      for (let i = 0; i < state.weights.length; i++) {
        let val;
        if (i === axX) val = nx;
        else if (i === axY) val = ny;
        else val = normalize(state.inputs[i], sc.inputs[i].min, sc.inputs[i].max);
        z += state.weights[i] * val;
      }
      ctx.fillStyle = heatmapColor(sigmoid(z));
      ctx.fillRect(pad + ix * cellW, pad + iy * cellH, cellW + 1, cellH + 1);
    }
  }

  // Gold contour line at p=0.5
  if (Math.abs(state.weights[axY]) > 0.001) {
    let restSum = state.bias;
    for (let i = 0; i < state.weights.length; i++) {
      if (i !== axX && i !== axY) {
        restSum += state.weights[i] * normalize(state.inputs[i], sc.inputs[i].min, sc.inputs[i].max);
      }
    }
    ctx.beginPath();
    ctx.moveTo(pad, pad + (1 - (-(state.weights[axX] * 0 + restSum) / state.weights[axY])) * plotH);
    ctx.lineTo(pad + plotW, pad + (1 - (-(state.weights[axX] * 1 + restSum) / state.weights[axY])) * plotH);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Crosshair
  const curX = pad + normalize(state.inputs[axX], sc.inputs[axX].min, sc.inputs[axX].max) * plotW;
  const curY = pad + (1 - normalize(state.inputs[axY], sc.inputs[axY].min, sc.inputs[axY].max)) * plotH;
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(curX, pad); ctx.lineTo(curX, pad + plotH); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(pad, curY); ctx.lineTo(pad + plotW, curY); ctx.stroke();
  ctx.setLineDash([]);

  ctx.beginPath();
  ctx.arc(curX, curY, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Axis labels
  ctx.fillStyle = '#9898a6';
  ctx.font = '12px ' + getFont();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(sc.inputs[axX]?.name || 'X', w / 2, h - 8);
  ctx.save();
  ctx.translate(14, h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(sc.inputs[axY]?.name || 'Y', 0, 0);
  ctx.restore();

  ctx.fillStyle = '#6a6a78';
  ctx.font = '10px ' + getFont();
  ctx.textAlign = 'center';
  for (let i = 0; i <= 5; i++) ctx.fillText((i / 5).toFixed(1), pad + (plotW * i / 5), pad + plotH + 18);
  ctx.textAlign = 'right';
  for (let i = 0; i <= 5; i++) ctx.fillText((1 - i / 5).toFixed(1), pad - 8, pad + (plotH * i / 5) + 4);

  // Color legend
  const legendW = 20, legendH = plotH;
  const legendX = w - pad + 10;
  for (let i = 0; i < legendH; i++) {
    ctx.fillStyle = heatmapColor(1 - i / legendH);
    ctx.fillRect(legendX, pad + i, legendW, 2);
  }
  ctx.strokeStyle = '#2e2e38';
  ctx.strokeRect(legendX, pad, legendW, legendH);
  ctx.fillStyle = '#9898a6';
  ctx.font = '9px ' + getFont();
  ctx.textAlign = 'left';
  ctx.fillText('1.0', legendX + legendW + 4, pad + 4);
  ctx.fillText('0.5', legendX + legendW + 4, pad + legendH / 2 + 3);
  ctx.fillText('0.0', legendX + legendW + 4, pad + legendH + 2);
}
