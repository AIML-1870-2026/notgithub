// ============================================================
// Application State & DOM References
// ============================================================

const state = {
  scenario: 'workout',
  inputs: [],
  weights: [],
  bias: 0.5,
  trainingPoints: [],
  trainingLabel: 1,
  stepCount: 0,
  learningRate: 0.1,
  isTraining: false,
  trainAnimId: null,
  activeTab: 'training',
  activeActivation: 'sigmoid',
  heatmapAxisX: 0,
  heatmapAxisY: 1,
  customScenario: null
};

// DOM helper
const $ = id => document.getElementById(id);

// Frequently used DOM elements
const probDisplay = $('probDisplay');
const decisionLabel = $('decisionLabel');
const mathDisplay = $('mathDisplay');
const inputSliders = $('inputSliders');
const weightsDisplay = $('weightsDisplay');
const stepCountEl = $('stepCount');
const accuracyEl = $('accuracy');
const lossDisplayEl = $('lossDisplay');
const pointCountEl = $('pointCount');

// Canvases
const trainingCanvas = $('trainingCanvas');
const trainingCtx = trainingCanvas.getContext('2d');
const heatmapCanvas = $('heatmapCanvas');
const heatmapCtx = heatmapCanvas.getContext('2d');
const activationCanvas = $('activationCanvas');
const activationCtx = activationCanvas.getContext('2d');
const neuronVizCanvas = $('neuronViz');
const neuronVizCtx = neuronVizCanvas.getContext('2d');
const synapseCanvas = $('synapseCanvas');
const synapseCtx = synapseCanvas.getContext('2d');
const sensitivityCanvas = $('sensitivityCanvas');
const sensitivityCtx = sensitivityCanvas.getContext('2d');
const sensitivityBarCanvas = $('sensitivityBarCanvas');
const sensitivityBarCtx = sensitivityBarCanvas.getContext('2d');
