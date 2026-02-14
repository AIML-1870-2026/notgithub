// ============================================================
// Main — Initialization, Scenario Loading, UI Updates
// ============================================================

// --- Scenario loading ---
function loadScenario(key) {
  state.scenario = key;
  const sc = getScenario();
  state.inputs = sc.inputs.map(inp => inp.default);
  state.weights = sc.inputs.map(inp => inp.weight);
  state.bias = sc.bias;
  state.trainingPoints = [];
  state.stepCount = 0;
  state.isTraining = false;
  if (state.trainAnimId) cancelAnimationFrame(state.trainAnimId);
  state.trainAnimId = null;

  $('headerSubtitle').textContent = sc.question;

  document.querySelectorAll('.scenario-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.scenario === key);
  });

  buildInputSliders();
  buildHeatmapSelectors();
  updateAll();
}

function buildInputSliders() {
  const sc = getScenario();
  inputSliders.innerHTML = '';
  sc.inputs.forEach((inp, i) => {
    const group = document.createElement('div');
    group.className = 'input-group';
    const isPositive = state.weights[i] >= 0;
    group.innerHTML = `
      <div class="input-label">
        <span>${inp.name}</span>
        <span class="weight-badge ${isPositive ? 'positive' : 'negative'}">w=${state.weights[i].toFixed(1)}</span>
        <span class="value" id="inputVal${i}">${state.inputs[i]}</span>
      </div>
      <input type="range" id="inputSlider${i}" min="${inp.min}" max="${inp.max}" step="${inp.step}" value="${state.inputs[i]}">
    `;
    inputSliders.appendChild(group);

    const slider = group.querySelector(`#inputSlider${i}`);
    slider.addEventListener('input', () => {
      state.inputs[i] = parseFloat(slider.value);
      $(`inputVal${i}`).textContent = Number.isInteger(state.inputs[i]) ? state.inputs[i] : state.inputs[i].toFixed(2);
      updateAll();
    });
  });
}

function buildHeatmapSelectors() {
  const sc = getScenario();
  const xSel = $('heatmapX');
  const ySel = $('heatmapY');
  xSel.innerHTML = '';
  ySel.innerHTML = '';
  sc.inputs.forEach((inp, i) => {
    xSel.innerHTML += `<option value="${i}" ${i === 0 ? 'selected' : ''}>${inp.name}</option>`;
    ySel.innerHTML += `<option value="${i}" ${i === 1 ? 'selected' : ''}>${inp.name}</option>`;
  });
  state.heatmapAxisX = 0;
  state.heatmapAxisY = Math.min(1, sc.inputs.length - 1);
  xSel.value = state.heatmapAxisX;
  ySel.value = state.heatmapAxisY;
}

// --- Master update ---
function updateAll() {
  const z = computeWeightedSum();
  const prob = sigmoid(z);
  const sc = getScenario();

  // Probability display
  probDisplay.textContent = prob.toFixed(2);
  probDisplay.style.color = probToColor(prob);

  // Decision label
  if (prob >= 0.6) {
    decisionLabel.textContent = sc.yesLabel;
    decisionLabel.style.color = 'var(--yes-color)';
  } else if (prob <= 0.4) {
    decisionLabel.textContent = sc.noLabel;
    decisionLabel.style.color = 'var(--no-color)';
  } else {
    decisionLabel.textContent = 'Undecided';
    decisionLabel.style.color = 'var(--gold)';
  }

  // Probability bar fill
  const probBar = $('probBarFill');
  if (probBar) {
    probBar.style.width = (prob * 100) + '%';
    probBar.style.background = `linear-gradient(90deg, ${probToColor(prob)}, ${probToColor(prob)})`;
  }

  // Math display
  let mathStr = 'z = ';
  const terms = [];
  for (let i = 0; i < state.inputs.length; i++) {
    const normed = normalize(state.inputs[i], sc.inputs[i].min, sc.inputs[i].max);
    terms.push(`(${state.weights[i].toFixed(2)}\u00D7${normed.toFixed(2)})`);
  }
  mathStr += terms.join(' + ') + ` + ${state.bias.toFixed(2)} = ${z.toFixed(3)} \u2192 \u03C3(z) = ${prob.toFixed(4)}`;
  mathDisplay.textContent = mathStr;

  // Weights display
  weightsDisplay.innerHTML = '';
  sc.inputs.forEach((inp, i) => {
    const isPos = state.weights[i] >= 0;
    weightsDisplay.innerHTML += `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.3rem;font-size:0.8rem;">
        <span style="color:var(--text-secondary)">${inp.name}</span>
        <span class="weight-badge ${isPos ? 'positive' : 'negative'}" style="font-size:0.75rem">${state.weights[i].toFixed(3)}</span>
      </div>`;
  });
  weightsDisplay.innerHTML += `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:0.5rem;padding-top:0.5rem;border-top:1px solid var(--border);font-size:0.8rem;">
      <span style="color:var(--text-secondary)">Bias</span>
      <span style="font-family:var(--mono);color:var(--gold);font-size:0.75rem">${state.bias.toFixed(3)}</span>
    </div>`;

  // Training stats
  stepCountEl.textContent = state.stepCount;
  pointCountEl.textContent = state.trainingPoints.length;
  updateAccuracy();

  // Activation outputs
  $('sigmoidOut').textContent = sigmoid(z).toFixed(3);
  $('stepOut').textContent = stepFn(z);
  $('reluOut').textContent = relu(z).toFixed(3);

  // Chain outputs
  updateChain();

  // Redraw canvases
  drawNeuronViz();
  drawTrainingCanvas();
  drawHeatmap();
  drawActivationCanvas();
  drawSensitivity();
  drawSensitivityBars();
}

function updateAccuracy() {
  if (state.trainingPoints.length === 0) {
    accuracyEl.textContent = '\u2014';
    lossDisplayEl.textContent = '\u2014';
    return;
  }
  let correct = 0;
  let totalLoss = 0;
  state.trainingPoints.forEach(pt => {
    let z = state.bias;
    for (let i = 0; i < state.weights.length; i++) {
      z += state.weights[i] * pt.normed[i];
    }
    const pred = sigmoid(z);
    if ((pred >= 0.5 && pt.label === 1) || (pred < 0.5 && pt.label === 0)) correct++;
    const eps = 1e-7;
    totalLoss += -(pt.label * Math.log(pred + eps) + (1 - pt.label) * Math.log(1 - pred + eps));
  });
  accuracyEl.textContent = (correct / state.trainingPoints.length * 100).toFixed(0) + '%';
  lossDisplayEl.textContent = (totalLoss / state.trainingPoints.length).toFixed(3);
}

// --- Tab Navigation ---
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    $('tab-' + btn.dataset.tab).classList.add('active');
    state.activeTab = btn.dataset.tab;
    requestAnimationFrame(() => updateAll());
  });
});

// --- Scenario Buttons ---
document.querySelectorAll('.scenario-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.dataset.scenario === 'custom') {
      openCustomModal();
      return;
    }
    loadScenario(btn.dataset.scenario);
  });
});

// --- Custom Scenario Modal ---
function openCustomModal() {
  $('customModal').classList.add('show');
  $('customInputs').innerHTML = '';
  addCustomInputRow();
  addCustomInputRow();
  addCustomInputRow();
}

function addCustomInputRow() {
  const row = document.createElement('div');
  row.className = 'modal-input-row';
  row.innerHTML = `
    <input type="text" placeholder="Input name" class="ci-name">
    <input type="number" placeholder="Min" class="ci-min" value="0">
    <input type="number" placeholder="Max" class="ci-max" value="1">
    <select class="ci-sign">
      <option value="1">Positive (+)</option>
      <option value="-1">Negative (\u2212)</option>
    </select>
  `;
  $('customInputs').appendChild(row);
}

$('addInputBtn').addEventListener('click', () => {
  if ($('customInputs').querySelectorAll('.modal-input-row').length < 5) addCustomInputRow();
});

$('cancelModal').addEventListener('click', () => $('customModal').classList.remove('show'));

$('customBias').addEventListener('input', () => {
  $('customBiasVal').textContent = parseFloat($('customBias').value).toFixed(1);
});

$('createScenario').addEventListener('click', () => {
  const question = $('customQuestion').value || 'Custom Decision?';
  const yesLabel = $('customYes').value || 'Yes!';
  const noLabel = $('customNo').value || 'No';
  const bias = parseFloat($('customBias').value);

  const rows = $('customInputs').querySelectorAll('.modal-input-row');
  const inputs = [];
  rows.forEach(row => {
    const name = row.querySelector('.ci-name').value;
    if (!name) return;
    const min = parseFloat(row.querySelector('.ci-min').value) || 0;
    const max = parseFloat(row.querySelector('.ci-max').value) || 1;
    const sign = parseInt(row.querySelector('.ci-sign').value);
    inputs.push({
      name, min, max,
      step: (max - min) <= 10 ? 0.1 : 1,
      default: (min + max) / 2,
      weight: sign * (0.5 + Math.random() * 0.8),
      unit: ''
    });
  });

  if (inputs.length < 3) {
    alert('Please add at least 3 inputs.');
    return;
  }

  state.customScenario = { question, yesLabel, noLabel, bias, inputs };
  $('customModal').classList.remove('show');
  loadScenario('custom');
});

$('customModal').addEventListener('click', (e) => {
  if (e.target === $('customModal')) $('customModal').classList.remove('show');
});

// --- Window Resize ---
window.addEventListener('resize', () => updateAll());

// --- Boot ---
loadScenario('workout');
