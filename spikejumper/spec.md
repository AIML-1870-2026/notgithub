# Spike Jumper

A Geometry Dash-inspired platformer game built with HTML5 Canvas.

## Gameplay
- Auto-scrolling platformer where the player navigates through obstacles
- Single-button control: SPACE/Tap to jump (tap = short hop, hold = full jump)
- No checkpoints - death restarts the level from the beginning
- Percentage-based level completion scoring

## Features
- **4 obstacle types**: Triangle spikes, moving blocks, rotating sawblades, lasers
- **Zone-triggered abilities**: Double jump, gravity flip, dash (activated via colored portals)
- **Speed zones**: Level sections change scroll speed
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
