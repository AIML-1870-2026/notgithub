// ============================================================
// Two-Neuron Chain (Stretch 4)
// ============================================================

function updateChain() {
  const z1 = computeWeightedSum();
  const n1Out = sigmoid(z1);
  $('n1Output').textContent = n1Out.toFixed(3);

  const synapseW = parseFloat($('synapseWeight').value);
  $('synapseWeightVal').textContent = synapseW.toFixed(1);

  const n2Extra = parseFloat($('n2Extra').value);
  const n2ExtraW = parseFloat($('n2ExtraW').value);
  const n2Bias = parseFloat($('n2Bias').value);

  $('n2ExtraVal').textContent = n2Extra.toFixed(2);
  $('n2ExtraWVal').textContent = n2ExtraW.toFixed(1);
  $('n2BiasVal').textContent = n2Bias.toFixed(1);

  const z2 = n1Out * synapseW + n2Extra * n2ExtraW + n2Bias;
  const n2Out = sigmoid(z2);
  $('n2Output').textContent = n2Out.toFixed(3);

  const mathEl = $('chainMath');
  mathEl.innerHTML = `
    <div class="card-title">Chain Computation</div>
    <div class="math-line">Neuron 1: z\u2081 = \u03A3(w\u1D62x\u1D62) + b\u2081 = ${z1.toFixed(3)}</div>
    <div class="math-line highlight">Neuron 1: a\u2081 = \u03C3(z\u2081) = \u03C3(${z1.toFixed(3)}) = ${n1Out.toFixed(4)}</div>
    <div class="math-line">Synapse: a\u2081 \u00D7 w_synapse = ${n1Out.toFixed(3)} \u00D7 ${synapseW.toFixed(1)} = ${(n1Out * synapseW).toFixed(4)}</div>
    <div class="math-line">Neuron 2: z\u2082 = (${(n1Out * synapseW).toFixed(3)}) + (${n2Extra.toFixed(2)} \u00D7 ${n2ExtraW.toFixed(1)}) + ${n2Bias.toFixed(1)} = ${z2.toFixed(3)}</div>
    <div class="math-line highlight">Neuron 2: a\u2082 = \u03C3(z\u2082) = \u03C3(${z2.toFixed(3)}) = ${n2Out.toFixed(4)}</div>
  `;
}

['synapseWeight', 'n2Extra', 'n2ExtraW', 'n2Bias'].forEach(id => {
  $(id).addEventListener('input', updateChain);
});

// Synapse animation
let synapseAnimFrame = 0;
function drawSynapseCanvas() {
  const canvas = synapseCanvas;
  const ctx = synapseCtx;
  const w = 80, h = 200;
  canvas.width = w * 2; canvas.height = h * 2;
  ctx.scale(2, 2);
  ctx.clearRect(0, 0, w, h);

  const z1 = computeWeightedSum();
  const n1Out = sigmoid(z1);
  const synapseW = parseFloat($('synapseWeight').value);
  const strength = Math.abs(synapseW) / 3;

  ctx.beginPath();
  ctx.moveTo(10, 40);
  ctx.bezierCurveTo(40, 60, 40, 140, 70, 160);
  ctx.strokeStyle = `rgba(251,191,36,${0.3 + strength * 0.7})`;
  ctx.lineWidth = 1 + strength * 3;
  ctx.stroke();

  synapseAnimFrame += 0.02 * n1Out;
  const numParticles = Math.floor(3 + n1Out * 5);
  for (let i = 0; i < numParticles; i++) {
    const t = ((synapseAnimFrame + i / numParticles) % 1);
    const bt = t;
    const cp1x = 40, cp1y = 60, cp2x = 40, cp2y = 140;
    const px = (1 - bt) ** 3 * 10 + 3 * (1 - bt) ** 2 * bt * cp1x + 3 * (1 - bt) * bt ** 2 * cp2x + bt ** 3 * 70;
    const py = (1 - bt) ** 3 * 40 + 3 * (1 - bt) ** 2 * bt * cp1y + 3 * (1 - bt) * bt ** 2 * cp2y + bt ** 3 * 160;

    ctx.beginPath();
    ctx.arc(px, py, 2 + n1Out * 2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(251,191,36,${0.5 + t * 0.5})`;
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(10, 40, 8, 0, Math.PI * 2);
  ctx.fillStyle = '#6c63ff';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(70, 160, 8, 0, Math.PI * 2);
  ctx.fillStyle = '#e879f9';
  ctx.fill();

  requestAnimationFrame(drawSynapseCanvas);
}
drawSynapseCanvas();
