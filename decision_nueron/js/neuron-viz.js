// ============================================================
// Neuron Visualization (sidebar graphic)
// ============================================================

function drawNeuronViz() {
  const canvas = neuronVizCanvas;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const ctx = neuronVizCtx;
  ctx.scale(dpr, dpr);
  const w = rect.width, h = rect.height;
  ctx.clearRect(0, 0, w, h);

  const sc = getScenario();
  const cx = w * 0.55, cy = h / 2, r = 34;
  const z = computeWeightedSum();
  const prob = sigmoid(z);
  const numInputs = sc.inputs.length;

  // Draw input connections with labels
  sc.inputs.forEach((inp, i) => {
    const iy = (i + 1) * h / (numInputs + 1);
    const ix = 10;
    const weight = state.weights[i];
    const thickness = Math.abs(weight) * 2.5 + 1;
    const alpha = 0.3 + Math.min(Math.abs(weight) / 2, 0.7);

    // Connection line
    ctx.beginPath();
    ctx.moveTo(ix + 14, iy);
    ctx.lineTo(cx - r - 4, cy);
    ctx.strokeStyle = weight >= 0
      ? `rgba(52,211,153,${alpha})`
      : `rgba(248,113,113,${alpha})`;
    ctx.lineWidth = thickness;
    ctx.stroke();

    // Input node
    ctx.beginPath();
    ctx.arc(ix + 14, iy, 6, 0, Math.PI * 2);
    ctx.fillStyle = weight >= 0 ? 'rgba(52,211,153,0.9)' : 'rgba(248,113,113,0.9)';
    ctx.fill();
    ctx.strokeStyle = weight >= 0 ? '#34d399' : '#f87171';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Input label (abbreviated)
    const shortName = inp.name.length > 8 ? inp.name.slice(0, 7) + '.' : inp.name;
    ctx.fillStyle = '#9898a6';
    ctx.font = '9px ' + getFont();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    // only show labels if enough room
    if (h > 140) {
      ctx.fillText(shortName, ix + 24, iy);
    }
  });

  // Outer glow ring
  ctx.beginPath();
  ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
  ctx.fillStyle = probToColor(prob).replace('rgb', 'rgba').replace(')', ',0.08)');
  ctx.fill();

  // Neuron body
  const grad = ctx.createRadialGradient(cx - 4, cy - 4, 0, cx, cy, r);
  grad.addColorStop(0, probToColor(prob));
  grad.addColorStop(0.6, probToColor(prob).replace('rgb', 'rgba').replace(')', ',0.5)'));
  grad.addColorStop(1, 'rgba(28,28,33,0.9)');
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = probToColor(prob);
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Sigma label
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px ' + getFont();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('\u03C3', cx, cy);

  // Output line
  ctx.beginPath();
  ctx.moveTo(cx + r + 4, cy);
  ctx.lineTo(w - 40, cy);
  ctx.strokeStyle = probToColor(prob);
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Output arrow
  const arrowX = w - 40;
  ctx.beginPath();
  ctx.moveTo(arrowX, cy - 5);
  ctx.lineTo(arrowX + 8, cy);
  ctx.lineTo(arrowX, cy + 5);
  ctx.fillStyle = probToColor(prob);
  ctx.fill();

  // Output value
  ctx.fillStyle = probToColor(prob);
  ctx.font = 'bold 16px ' + getFont();
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(prob.toFixed(2), w - 4, cy);
}
