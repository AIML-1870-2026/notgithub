# Readable — Specification

## Project Overview

Readable is an interactive webpage that lets users explore how background color, text color, and text size combinations affect readability on digital screens. It calculates WCAG contrast ratios in real-time and provides tools for testing accessibility across different vision types.

## Features

### Background Color Controls
- Three RGB sliders spanning 0–255 (Red, Green, Blue)
- Integer input fields synchronized bidirectionally with sliders
- Live color chip and hex value display
- Colored slider track gradients that update based on current values

### Text Color Controls
- Three RGB sliders spanning 0–255 (Red, Green, Blue)
- Integer input fields synchronized bidirectionally with sliders
- Live color chip and hex value display
- Colored slider track gradients that update based on current values

### Text Size Control
- Single slider ranging from 12px to 72px
- Synchronized integer input with "px" unit label
- Adjusts font size of all sample text in real-time

### Text Preview Area
- Large preview card displaying sample heading and body text
- Background color, text color, and font size update in real-time
- Heading rendered at 1.5x the current font size for visual hierarchy
- Smooth color transitions for polished feel

### Contrast Ratio Display
- WCAG-calculated contrast ratio formatted as "X.XX:1"
- Uses the standard formula: (L1 + 0.05) / (L2 + 0.05)
- Updates automatically when any color changes

### Luminosity Displays
- Relative luminance for background color (0.0000–1.0000)
- Relative luminance for text color (0.0000–1.0000)
- Helps users understand the contrast ratio calculation

### Stretch A: Vision Type Simulation
- Radio pill buttons: Normal, Protanopia, Deuteranopia, Tritanopia, Monochromacy
- When non-Normal is selected, the preview simulates that vision type
- Color sliders are disabled during simulation (re-enabled on Normal)
- Descriptive hint text explains each condition
- Selecting a preset resets vision to Normal

### Stretch B: WCAG Compliance Indicator
- Two pass/fail badges: AA Normal and AA Large
- Normal text threshold: 4.5:1 contrast ratio
- Large text threshold: 3:1 contrast ratio (text ≥ 24px)
- Green badge for pass, red badge for fail
- Text labels: "PASS — AA Normal" / "FAIL — AA Normal"

### Stretch C: Preset Color Schemes
- 8 preset buttons with mini swatch previews:
  - High Contrast (white bg, black text) — 21:1
  - Dark Mode (near-black bg, light text) — ~14:1
  - Solarized (dark teal bg, gray text) — ~4.6:1
  - Warm Paper (cream bg, brown text) — ~13:1
  - GitHub Light (white bg, dark gray text) — ~18:1
  - Low Contrast (light gray bg/text) — ~1.5:1 (FAIL)
  - Red on Green — ~2.6:1 (FAIL, color blind unfriendly)
  - Yellow Clash — ~1.05:1 (FAIL, nearly invisible)

## Layout

Two-column grid at desktop (340px controls | flexible preview). Controls panel on the left includes background RGB, text RGB, text size, and stats. Preview card and WCAG badges on the right. Vision simulation and presets span full width below. Responsive: stacks to single column at ≤820px with preview on top.

## Technical Details

### Color Math (WCAG 2.1)

**Relative Luminance:**
```
For each channel C in [R, G, B]:
  Clinear = C / 255
  If Clinear <= 0.03928: Csrgb = Clinear / 12.92
  Else: Csrgb = ((Clinear + 0.055) / 1.055) ^ 2.4

L = 0.2126 * Rsrgb + 0.7152 * Gsrgb + 0.0722 * Bsrgb
```

**Contrast Ratio:**
```
ratio = (max(L1, L2) + 0.05) / (min(L1, L2) + 0.05)
```

**Color Blindness Matrices (Brettel/Vienot model):**
- Protanopia: [0.567, 0.433, 0, 0.558, 0.442, 0, 0, 0.242, 0.758]
- Deuteranopia: [0.625, 0.375, 0, 0.7, 0.3, 0, 0, 0.3, 0.7]
- Tritanopia: [0.95, 0.05, 0, 0, 0.433, 0.567, 0, 0.475, 0.525]

**Monochromacy:** gray = round(0.299R + 0.587G + 0.114B)

## File Structure
```
readable/
├── index.html       — Page structure, fonts, script tags
├── style.css        — Dark theme, custom properties, responsive layout
├── color-math.js    — Pure math utilities (luminance, contrast, simulations)
├── app.js           — Main orchestrator, DOM wiring, event handling
└── spec.md          — This document
```

## Design Decisions
- Dark theme with CSS custom properties for consistency
- IIFE module pattern (no build tools, no frameworks)
- Contrast stats use original colors, not simulated — accessibility ratings should reflect actual published colors
- Applying a preset resets vision simulation to Normal
- Slider ↔ input sync uses a `source` parameter to prevent feedback loops
