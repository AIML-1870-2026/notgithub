# Spike Jumper

A Geometry Dash-inspired platformer game built with HTML5 Canvas.

## Gameplay
- Auto-scrolling platformer where the player navigates through obstacles
- Single-button control: SPACE/Tap to jump (tap = short hop, hold = full jump)
- No checkpoints - death restarts the level from the beginning
- Percentage-based level completion scoring

## Levels

### 1. Neon Genesis (Easy)
7 sections, 14000 length, base speed 420
- **Tutorial** — Single/double/triple spikes
- **Jump Orbs** — Mid-air orb taps to extend jumps over wide spike fields
- **Speed Up** — Faster scroll with moving blocks
- **Gravity Flip** — Ceiling walking with inverted controls
- **Sawblades** — Spinning blades on vertical paths
- **Dash** — Auto-squish through tight low ceilings
- **Finale** — Lasers with ground gaps + sawblades

### 2. Cyber Drift (Medium)
6 sections, 12000 length, base speed 440
- **Warm Up** — Progressively tighter spike patterns
- **Moving Maze** — Vertically oscillating blocks to dodge
- **Orb Chains** — Multi-orb sequences over spike fields and floating hazards
- **Saw Gauntlet** — Alternating sawblades, static+moving combos
- **Flip Zone** — Gravity flip with ceiling spikes and a tricky re-entry
- **Speed Finale** — 540px/s with mixed sawblades, blocks, and spikes

### 3. Void Runner (Hard)
7 sections, 16000 length, base speed 480
- **No Mercy** — Triples from the start, 4-wide orb jumps
- **Blade Dance** — Crossing sawblade pairs at 500px/s
- **Upside Down** — Extended gravity flip with sawblades while inverted
- **Laser Hall** — 4 lasers with ground gaps, saw+laser combos
- **Dash Gauntlet** — Back-to-back dash corridors
- **Orb Ascent** — Orb chains over floating spikes and sawblades
- **Chaos** — 540px/s, every mechanic mixed together

## Features
- **7 obstacle types**: Triangle spikes (ground/ceiling/floating), moving blocks, rotating sawblades, lasers, low ceilings, jump orbs, speed zones
- **Zone-triggered abilities**: Gravity flip, dash (activated via colored portals)
- **Zone banners**: Floating section titles with hints that fade in/out when entering new areas
- **Speed zones**: Level sections dynamically change scroll speed
- **Visual polish**: Squash/stretch animations, particle effects, screen shake, parallax grid background
- **Audio**: Synthesized SFX and procedural background music (Web Audio API)
- **Full menu system**: Title screen, settings, level select, high scores
- **Persistent scores**: Best progress and attempts saved via localStorage

## Controls
- **SPACE / Arrow Up / Tap**: Jump
- **ESC**: Pause

## Tech
- HTML5 Canvas rendering
- ES Modules architecture
- Web Audio API (no external audio files)
- localStorage for persistence
