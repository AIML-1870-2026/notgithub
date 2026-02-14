// ============================================================
// Activation Function Showdown (Stretch 3)
// ============================================================

function drawActivationCanvas() {
  const { w, h, ctx } = resizeCanvas(activationCanvas, 350);
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

  const zRange = 8;
  const yRange = 1.5;

  function mapZ(z) { return pad + (z + zRange / 2) / zRange * plotW; }
  function mapY(y) { return pad + plotH - ((y + 0.2) / yRange * plotH); }

  // Axes
  ctx.strokeStyle = '#4a4a56';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(pad, mapY(0)); ctx.lineTo(pad + plotW, mapY(0)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(mapZ(0), pad); ctx.lineTo(mapZ(0), pad + plotH); ctx.stroke();

  const functions = [
    { name: 'Sigmoid', fn: sigmoid, color: '#6c63ff' },
    { name: 'Step', fn: stepFn, color: '#fbbf24' },
    { name: 'ReLU', fn: (z) => Math.min(relu(z), 1.3), color: '#34d399' }
  ];

  functions.forEach(f => {
    ctx.beginPath();
    for (let px = 0; px <= plotW; px++) {
      const z = (px / plotW) * zRange - zRange / 2;
      const y = f.fn(z);
      const screenX = pad + px;
      const screenY = mapY(y);
      if (px === 0) ctx.moveTo(screenX, screenY);
      else ctx.lineTo(screenX, screenY);
    }
    ctx.strokeStyle = f.color;
    ctx.lineWidth = 2.5;
    ctx.stroke();
  });

  // Current z marker
  const z = computeWeightedSum();
  const clampedZ = Math.max(-zRange / 2, Math.min(zRange / 2, z));
  const markerX = mapZ(clampedZ);

  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(markerX, pad); ctx.lineTo(markerX, pad + plotH); ctx.stroke();
  ctx.setLineDash([]);

  functions.forEach(f => {
    const y = f.fn(z);
    const screenY = mapY(Math.min(y, 1.3));
    ctx.beginPath();
    ctx.arc(markerX, screenY, 6, 0, Math.PI * 2);
    ctx.fillStyle = f.color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // Labels
  ctx.fillStyle = '#9898a6';
  ctx.font = '12px ' + getFont();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('Weighted Sum (z)', w / 2, h - 8);
  ctx.save();
  ctx.translate(14, h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Output', 0, 0);
  ctx.restore();

  ctx.fillStyle = '#6a6a78';
  ctx.font = '10px ' + getFont();
  for (let zv = -4; zv <= 4; zv += 2) ctx.fillText(zv, mapZ(zv), pad + plotH + 18);
  ctx.textAlign = 'right';
  for (let y = 0; y <= 1; y += 0.5) ctx.fillText(y.toFixed(1), pad - 8, mapY(y) + 4);

  // Legend
  ctx.textAlign = 'left';
  functions.forEach((f, i) => {
    const lx = pad + 10, ly = pad + 15 + i * 18;
    ctx.fillStyle = f.color;
    ctx.fillRect(lx, ly - 5, 12, 3);
    ctx.fillText(f.name, lx + 18, ly);
  });

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px ' + getFont();
  ctx.textAlign = 'center';
  ctx.fillText('z=' + z.toFixed(2), markerX, pad - 8);
}

// Activation card click handlers
document.querySelectorAll('.activation-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.activation-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    state.activeActivation = card.dataset.activation;
  });
});
