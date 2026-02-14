// ============================================================
// Sensitivity Analysis (Stretch 5)
// ============================================================

function drawSensitivity() {
  const { w, h, ctx } = resizeCanvas(sensitivityCanvas, 350);
  const sc = getScenario();
  const pad = 50;
  const plotW = w - pad * 2;
  const plotH = h - pad * 2;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#1c1c21';
  ctx.fillRect(0, 0, w, h);

  // Grid
  ctx.strokeStyle = 'rgba(46,46,56,0.6)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 10; i++) {
    const x = pad + plotW * i / 10;
    const y = pad + plotH * i / 10;
    ctx.beginPath(); ctx.moveTo(x, pad); ctx.lineTo(x, pad + plotH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(pad + plotW, y); ctx.stroke();
  }

  const colors = ['#6c63ff', '#34d399', '#f87171', '#fbbf24', '#60a5fa'];
  const steps = 100;

  sc.inputs.forEach((inp, idx) => {
    ctx.beginPath();
    for (let s = 0; s <= steps; s++) {
      const sweepVal = s / steps;
      let z = state.bias;
      for (let i = 0; i < state.weights.length; i++) {
        const val = i === idx ? sweepVal : normalize(state.inputs[i], sc.inputs[i].min, sc.inputs[i].max);
        z += state.weights[i] * val;
      }
      const prob = sigmoid(z);
      const screenX = pad + (s / steps) * plotW;
      const screenY = pad + (1 - prob) * plotH;
      if (s === 0) ctx.moveTo(screenX, screenY);
      else ctx.lineTo(screenX, screenY);
    }
    ctx.strokeStyle = colors[idx % colors.length];
    ctx.lineWidth = 2;
    ctx.stroke();

    // Vertical marker at current value
    const curNorm = normalize(state.inputs[idx], inp.min, inp.max);
    const markerX = pad + curNorm * plotW;
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = colors[idx % colors.length] + '80';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(markerX, pad); ctx.lineTo(markerX, pad + plotH); ctx.stroke();
    ctx.setLineDash([]);

    let z = state.bias;
    for (let i = 0; i < state.weights.length; i++) {
      const val = i === idx ? curNorm : normalize(state.inputs[i], sc.inputs[i].min, sc.inputs[i].max);
      z += state.weights[i] * val;
    }
    ctx.beginPath();
    ctx.arc(markerX, pad + (1 - sigmoid(z)) * plotH, 4, 0, Math.PI * 2);
    ctx.fillStyle = colors[idx % colors.length];
    ctx.fill();
  });

  // Legend
  ctx.textAlign = 'left';
  ctx.font = '11px ' + getFont();
  sc.inputs.forEach((inp, i) => {
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect(pad + 10, pad + 11 + i * 16, 12, 3);
    ctx.fillText(inp.name, pad + 28, pad + 15 + i * 16);
  });

  // Axis labels
  ctx.fillStyle = '#9898a6';
  ctx.font = '12px ' + getFont();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('Input Value (normalized)', w / 2, h - 8);
  ctx.save();
  ctx.translate(14, h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Output Probability', 0, 0);
  ctx.restore();

  ctx.fillStyle = '#6a6a78';
  ctx.font = '10px ' + getFont();
  ctx.textAlign = 'center';
  for (let i = 0; i <= 5; i++) ctx.fillText((i / 5).toFixed(1), pad + plotW * i / 5, pad + plotH + 18);
  ctx.textAlign = 'right';
  for (let i = 0; i <= 5; i++) ctx.fillText((1 - i / 5).toFixed(1), pad - 8, pad + plotH * i / 5 + 4);
}

function drawSensitivityBars() {
  const { w, h, ctx } = resizeCanvas(sensitivityBarCanvas, 200);
  const sc = getScenario();
  const padObj = { top: 30, right: 20, bottom: 30, left: 120 };
  const plotW = w - padObj.left - padObj.right;
  const plotH = h - padObj.top - padObj.bottom;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#1c1c21';
  ctx.fillRect(0, 0, w, h);

  const sensitivities = sc.inputs.map((inp, idx) => {
    let minP = 1, maxP = 0;
    for (let s = 0; s <= 50; s++) {
      const sweepVal = s / 50;
      let z = state.bias;
      for (let i = 0; i < state.weights.length; i++) {
        const val = i === idx ? sweepVal : normalize(state.inputs[i], sc.inputs[i].min, sc.inputs[i].max);
        z += state.weights[i] * val;
      }
      const prob = sigmoid(z);
      minP = Math.min(minP, prob);
      maxP = Math.max(maxP, prob);
    }
    return { name: inp.name, sensitivity: maxP - minP, idx };
  });

  sensitivities.sort((a, b) => b.sensitivity - a.sensitivity);

  const colors = ['#6c63ff', '#34d399', '#f87171', '#fbbf24', '#60a5fa'];
  const barH = Math.min(28, plotH / sensitivities.length - 4);
  const maxSens = Math.max(...sensitivities.map(s => s.sensitivity), 0.01);

  ctx.fillStyle = '#9898a6';
  ctx.font = 'bold 11px ' + getFont();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('Sensitivity Ranking (output range)', w / 2, 18);

  sensitivities.forEach((s, i) => {
    const y = padObj.top + i * (plotH / sensitivities.length) + (plotH / sensitivities.length - barH) / 2;
    const bw = (s.sensitivity / maxSens) * plotW;

    ctx.fillStyle = colors[s.idx % colors.length];
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.roundRect(padObj.left, y, bw, barH, 4);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#e8e8ed';
    ctx.font = '11px ' + getFont();
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(s.name, padObj.left - 8, y + barH / 2);

    ctx.fillStyle = '#9898a6';
    ctx.font = '10px ' + getFont();
    ctx.textAlign = 'left';
    ctx.fillText(s.sensitivity.toFixed(3), padObj.left + bw + 6, y + barH / 2);
  });
}
