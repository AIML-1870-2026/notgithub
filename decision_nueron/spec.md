# Decision Neuron — Spec

## Overview
An interactive single-neuron simulator that teaches how a logistic regression neuron makes binary decisions. Users manipulate inputs, weights, and bias in real time across five visualization tabs, with four built-in scenarios and a custom scenario builder.

## Core Neuron Model

The neuron computes a weighted sum plus bias, passed through sigmoid activation:

```
z = w1*x1 + w2*x2 + ... + wn*xn + b
output = sigmoid(z) = 1 / (1 + e^(-z))
```

All inputs are normalized to [0, 1] before computation. The output is interpreted as a probability:
- **> 0.6** → Yes (green)
- **< 0.4** → No (red)
- **0.4–0.6** → Undecided (neutral)

## Scenarios

Each scenario provides a relatable binary decision with 4–5 input features, preset weights, and a bias.

| Scenario | Question | Yes Label | No Label | Inputs |
|----------|----------|-----------|----------|--------|
| **Workout** | Should I Work Out Today? | Let's Go! | Rest Day | Workouts This Week, Fatigue, Sleep, Schedule Openness, Motivation |
| **Cook** | Cook or Order Takeout? | Cook! | Order In | Budget Left, Time Available, Ingredients, Energy Level, Craving Intensity |
| **Study** | Should I Study or Game? | Study! | Game Time | Exam Proximity, Current Grade, Assignment Due, Friends Online, Focus Level |
| **Road Trip** | Worth the Road Trip? | Let's Roll! | Stay Home | Distance, Gas Budget, Friends Going, Event Quality |
| **Custom** | User-defined | User-defined | User-defined | 3–5 user-defined inputs via modal |

## Layout

### Header
- Title: "Decision Neuron"
- Subtitle updates to reflect the active scenario's question

### Scenario Bar
- Row of buttons to switch between presets
- "+ Custom" opens the custom scenario modal

### Sidebar (left)
- **Decision Output card** — shows the Yes/No label, probability value (0.00–1.00), probability bar, and the math formula
- **Neuron visualization** — canvas drawing of input nodes connected to a central neuron body with output arrow; connection thickness reflects weight magnitude, colors reflect sign (green = positive, red = negative)
- **Input sliders** — one per scenario input; dragging updates all visualizations in real time
- **Weights & Bias display** — read-only view of current learned parameters

### Main Content (right, tabbed)

#### Tab 1: Training
Interactive supervised learning via gradient descent on binary cross-entropy loss.

**Controls:**
- **Label Toggle** — switches between Yes (green check) and No (red X) for the next point
- **Step** — runs one gradient descent iteration across all training points
- **Train** — starts continuous auto-training (button becomes "Stop"); speed controlled by slider (1–20 steps per frame)
- **Reset** — clears all points and restores scenario default weights/bias
- **Speed slider** — controls steps per animation frame during auto-train

**Stats row:** Steps taken, Accuracy (%), Loss (BCE), Point count

**Canvas:**
- 2D plot with axes corresponding to two selected inputs
- Click to place labeled training points (green circles = Yes, red = No)
- Gold dashed decision boundary line with region labels
- Purple crosshair showing current input position
- Overlay hint appears when no points are plotted, prompting user to click

**Training algorithm (per step):**
```
For each training point (x, y):
  pred = sigmoid(w*x + b)
  error = pred - y
  w_i -= learning_rate * error * x_i
  b   -= learning_rate * error
```
Learning rate: 0.1 (fixed)

**Toast warning:** pressing Step or Train with no points shows a yellow warning toast.

#### Tab 2: Heatmap
- Dropdown selectors for X and Y axes (any two inputs)
- 60x60 resolution probability heatmap (blue → white → magenta)
- Gold contour line at p = 0.5 (decision boundary)
- White crosshair at current input values

#### Tab 3: Activations
- Three clickable cards: **Sigmoid**, **Step**, **ReLU**
- Each shows its formula and current output value
- Canvas plots all three functions simultaneously (-6 to +6 range)
- Vertical marker at current weighted sum z with output dot

#### Tab 4: Neuron Chain
Two-neuron network demonstrating signal propagation:
- **Neuron 1** uses the main scenario inputs/weights → sigmoid output
- **Synapse weight** slider (-3 to 3) connects Neuron 1 → Neuron 2
- **Neuron 2** receives: (Neuron 1 output * synapse weight) + (extra input * extra weight) + bias 2
- Animated pulse on synapse canvas; full math breakdown displayed below

#### Tab 5: Sensitivity
- **Top canvas:** sweep curves showing how each input (varied 0→1) affects output probability while others are held constant
- **Bottom canvas:** horizontal bar chart ranking inputs by output range (most influential first)
- Vertical markers show current input values on each curve

## Custom Scenario Modal
- Text fields for decision question, Yes label, No label
- Dynamic input rows (3–5) with name, min, max, and sign (+/-)
- Bias slider (-3 to 3)
- Weights auto-assigned: `sign * (0.5 + random(0, 0.8))`
- Validation: at least 3 named inputs required

## File Structure

```
decision_nueron/
  index.html          — DOM structure, all tabs and modal
  styles.css          — Dark theme, responsive layout, animations
  spec.md             — This file
  js/
    scenarios.js      — SCENARIOS object (4 presets)
    state.js          — Global state object and DOM element cache
    utils.js          — Math helpers (sigmoid, relu, normalize, color lerp, toast, canvas resize)
    neuron-viz.js     — Sidebar neuron diagram renderer
    training.js       — Training canvas, gradient descent, controls
    heatmap.js        — 2D probability heatmap renderer
    activation.js     — Activation function comparison plots
    chain.js          — Two-neuron chain computation and synapse animation
    sensitivity.js    — Sensitivity sweep curves and ranking bars
    main.js           — Initialization, scenario switching, slider builders, custom modal, updateAll()
```

**Load order matters:** scenarios → state → utils → neuron-viz → training → heatmap → activation → chain → sensitivity → main

## Technical Details
- Pure vanilla JS — no frameworks or build tools
- Single HTML file entry point loading 10 JS modules via script tags
- All canvases handle device pixel ratio (DPR) for crisp rendering on retina displays
- Window resize triggers full redraw via `updateAll()`
- Font stack: Inter (UI) + JetBrains Mono (numeric values)
- Dark theme with CSS custom properties
