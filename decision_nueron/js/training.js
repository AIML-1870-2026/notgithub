// ============================================================
// Training Mode — Plot, Algorithm, Controls
// ============================================================

// --- Training Canvas Drawing ---
function drawTrainingCanvas() {
  const { w, h, ctx } = resizeCanvas(trainingCanvas, 450);
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
    const x = pad + (plotW * i / 10);
    const y = pad + (plotH * i / 10);
    ctx.beginPath(); ctx.moveTo(x, pad); ctx.lineTo(x, pad + plotH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(pad + plotW, y); ctx.stroke();
  }

  const axX = state.heatmapAxisX < sc.inputs.length ? state.heatmapAxisX : 0;
  const axY = state.heatmapAxisY < sc.inputs.length ? state.heatmapAxisY : Math.min(1, sc.inputs.length - 1);

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

  // Tick labels
  ctx.fillStyle = '#6a6a78';
  ctx.font = '10px ' + getFont();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  for (let i = 0; i <= 5; i++) {
    ctx.fillText((i / 5).toFixed(1), pad + (plotW * i / 5), pad + plotH + 18);
  }
  ctx.textAlign = 'right';
  for (let i = 0; i <= 5; i++) {
    ctx.fillText((1 - i / 5).toFixed(1), pad - 8, pad + (plotH * i / 5) + 4);
  }

  // Decision boundary line
  if (sc.inputs.length >= 2 && Math.abs(state.weights[axY]) > 0.001) {
    let restSum = state.bias;
    for (let i = 0; i < state.weights.length; i++) {
      if (i !== axX && i !== axY) {
        restSum += state.weights[i] * normalize(state.inputs[i], sc.inputs[i].min, sc.inputs[i].max);
      }
    }
    const x0 = 0, x1 = 1;
    const y0 = -(state.weights[axX] * x0 + restSum) / state.weights[axY];
    const y1 = -(state.weights[axX] * x1 + restSum) / state.weights[axY];

    const screenX0 = pad + x0 * plotW;
    const screenX1 = pad + x1 * plotW;
    const screenY0 = pad + (1 - y0) * plotH;
    const screenY1 = pad + (1 - y1) * plotH;

    ctx.beginPath();
    ctx.moveTo(screenX0, screenY0);
    ctx.lineTo(screenX1, screenY1);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Label sides
    const midX = (screenX0 + screenX1) / 2;
    const midY = (screenY0 + screenY1) / 2;
    const dx = screenX1 - screenX0;
    const dy = screenY1 - screenY0;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / len * 20;
    const ny = dx / len * 20;

    ctx.font = 'bold 11px ' + getFont();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let testZ = state.weights[axX] * 0.5 + state.weights[axY] * 0.5 + restSum;
    if (sigmoid(testZ + Math.abs(state.weights[axY]) * 0.3) > 0.5) {
      ctx.fillStyle = 'rgba(52,211,153,0.7)';
      ctx.fillText(sc.yesLabel, midX + nx, midY + ny);
      ctx.fillStyle = 'rgba(248,113,113,0.7)';
      ctx.fillText(sc.noLabel, midX - nx, midY - ny);
    } else {
      ctx.fillStyle = 'rgba(248,113,113,0.7)';
      ctx.fillText(sc.noLabel, midX + nx, midY + ny);
      ctx.fillStyle = 'rgba(52,211,153,0.7)';
      ctx.fillText(sc.yesLabel, midX - nx, midY - ny);
    }
  }

  // Training points
  state.trainingPoints.forEach(pt => {
    const px = pad + pt.normed[axX] * plotW;
    const py = pad + (1 - pt.normed[axY]) * plotH;
    ctx.beginPath();
    ctx.arc(px, py, 7, 0, Math.PI * 2);
    ctx.fillStyle = pt.label === 1 ? 'rgba(52,211,153,0.8)' : 'rgba(248,113,113,0.8)';
    ctx.fill();
    ctx.strokeStyle = pt.label === 1 ? '#34d399' : '#f87171';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // Crosshair for current position
  const curX = pad + normalize(state.inputs[axX], sc.inputs[axX].min, sc.inputs[axX].max) * plotW;
  const curY = pad + (1 - normalize(state.inputs[axY], sc.inputs[axY].min, sc.inputs[axY].max)) * plotH;
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = 'rgba(108,99,255,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(curX, pad); ctx.lineTo(curX, pad + plotH); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(pad, curY); ctx.lineTo(pad + plotW, curY); ctx.stroke();
  ctx.setLineDash([]);

  ctx.beginPath();
  ctx.arc(curX, curY, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#6c63ff';
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

// --- Click to add training point ---
trainingCanvas.addEventListener('click', (e) => {
  const sc = getScenario();
  const rect = trainingCanvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const pad = 50;
  const plotW = rect.width - pad * 2;
  const plotH = 450 - pad * 2;

  const normX = (mx - pad) / plotW;
  const normY = 1 - (my - pad) / plotH;
  if (normX < 0 || normX > 1 || normY < 0 || normY > 1) return;

  const axX = state.heatmapAxisX;
  const axY = state.heatmapAxisY;
  const normed = [];
  for (let i = 0; i < sc.inputs.length; i++) {
    if (i === axX) normed.push(normX);
    else if (i === axY) normed.push(normY);
    else normed.push(normalize(state.inputs[i], sc.inputs[i].min, sc.inputs[i].max));
  }
  state.trainingPoints.push({ normed, label: state.trainingLabel });
  updateCanvasHint();
  updateAll();
});

// --- Gradient Descent on BCE ---
function trainStep() {
  if (state.trainingPoints.length === 0) return;
  const lr = state.learningRate;
  state.trainingPoints.forEach(pt => {
    let z = state.bias;
    for (let i = 0; i < state.weights.length; i++) {
      z += state.weights[i] * pt.normed[i];
    }
    const pred = sigmoid(z);
    const error = pred - pt.label;
    for (let i = 0; i < state.weights.length; i++) {
      state.weights[i] -= lr * error * pt.normed[i];
    }
    state.bias -= lr * error;
  });
  state.stepCount++;
}

// --- Training Controls ---
$('labelToggle').addEventListener('click', () => {
  state.trainingLabel = state.trainingLabel === 1 ? 0 : 1;
  const toggle = $('labelToggle');
  toggle.className = 'label-toggle ' + (state.trainingLabel === 1 ? 'yes' : 'no');
  $('labelIcon').textContent = state.trainingLabel === 1 ? '\u2713' : '\u2717';
  $('labelText').textContent = state.trainingLabel === 1 ? 'Yes' : 'No';
});

$('stepBtn').addEventListener('click', () => {
  if (state.trainingPoints.length === 0) {
    showToast('Add training points first — click on the canvas!', 'warning');
    return;
  }
  trainStep();
  updateAll();
  buildInputSliders();
});

$('trainBtn').addEventListener('click', () => {
  if (state.isTraining) {
    state.isTraining = false;
    $('trainBtn').textContent = 'Train';
    return;
  }
  if (state.trainingPoints.length === 0) {
    showToast('Add training points first — click on the canvas!', 'warning');
    return;
  }
  state.isTraining = true;
  $('trainBtn').textContent = 'Stop';

  function autoTrain() {
    if (!state.isTraining) return;
    const speed = parseInt($('speedSlider').value);
    for (let i = 0; i < speed; i++) trainStep();
    updateAll();
    buildInputSliders();
    state.trainAnimId = requestAnimationFrame(autoTrain);
  }
  autoTrain();
});

$('resetBtn').addEventListener('click', () => {
  state.isTraining = false;
  $('trainBtn').textContent = 'Train';
  if (state.trainAnimId) cancelAnimationFrame(state.trainAnimId);
  const sc = getScenario();
  state.trainingPoints = [];
  state.stepCount = 0;
  state.weights = sc.inputs.map(inp => inp.weight);
  state.bias = sc.bias;
  updateCanvasHint();
  buildInputSliders();
  updateAll();
});
