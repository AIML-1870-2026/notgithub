// ============================================================
// Utility & Math Functions
// ============================================================

function sigmoid(z) { return 1 / (1 + Math.exp(-z)); }
function stepFn(z) { return z >= 0 ? 1 : 0; }
function relu(z) { return Math.max(0, z); }

function normalize(val, min, max) {
  if (max === min) return 0.5;
  return (val - min) / (max - min);
}

function getScenario() {
  if (state.scenario === 'custom' && state.customScenario) return state.customScenario;
  return SCENARIOS[state.scenario] || SCENARIOS.workout;
}

function computeWeightedSum() {
  const sc = getScenario();
  let z = state.bias;
  for (let i = 0; i < state.inputs.length; i++) {
    const normed = normalize(state.inputs[i], sc.inputs[i].min, sc.inputs[i].max);
    z += state.weights[i] * normed;
  }
  return z;
}

function getFont() {
  return getComputedStyle(document.body).fontFamily;
}

function lerpColor(a, b, t) {
  const ar = parseInt(a.slice(1, 3), 16), ag = parseInt(a.slice(3, 5), 16), ab = parseInt(a.slice(5, 7), 16);
  const br_ = parseInt(b.slice(1, 3), 16), bg = parseInt(b.slice(3, 5), 16), bb = parseInt(b.slice(5, 7), 16);
  const r = Math.round(ar + (br_ - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${bl})`;
}

function probToColor(p) {
  if (p < 0.5) return lerpColor('#f87171', '#ffffff', p * 2);
  return lerpColor('#ffffff', '#34d399', (p - 0.5) * 2);
}

function heatmapColor(p) {
  if (p < 0.5) return lerpColor('#3b82f6', '#ffffff', p * 2);
  return lerpColor('#ffffff', '#e879f9', (p - 0.5) * 2);
}

function showToast(message, type = 'info') {
  const container = $('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast' + (type === 'warning' ? ' warning' : '');
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 2600);
}

function updateCanvasHint() {
  const hint = $('canvasHint');
  if (!hint) return;
  if (state.trainingPoints.length > 0) {
    hint.classList.add('hidden');
  } else {
    hint.classList.remove('hidden');
  }
}

function resizeCanvas(canvas, desiredHeight) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = desiredHeight * dpr;
  canvas.style.height = desiredHeight + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return { w: rect.width, h: desiredHeight, ctx };
}
