// ── Main Game Loop ──

import { GAME_STATE, DEATH, PHYSICS } from './config.js';
import { getState, setState, getPlayer, setPlayer, resetLevel, getProgress } from './gameState.js';
import { initInput, consumeEscape, clearInputState } from './input.js';
import { initRenderer, render, renderMenuBackground } from './renderer.js';
import { updateShake, triggerShake } from './camera.js';
import { updatePlayer, getPlayerBounds } from './player.js';
import { checkCollision } from './obstacles.js';
import { activatePortal } from './portals.js';
import { loadLevel } from './level.js';
import * as particles from './particles.js';
import * as effects from './effects.js';
import * as audio from './audio.js';
import * as menu from './menu.js';
import * as storage from './storage.js';
import { updateZoneBanner } from './hud.js';
import './reachability.js';

const PHYSICS_DT = 1000 / 60;
let accumulator = 0;
let lastTime = 0;
let gameTime = 0;

function init() {
    initRenderer();
    initInput();
    menu.initMenu();

    // Set up pause menu buttons
    document.getElementById('btn-resume')?.addEventListener('click', () => {
        audio.play('menu_select');
        setState({ phase: GAME_STATE.PLAYING });
        menu.hidePause();
    });
    document.getElementById('btn-restart')?.addEventListener('click', () => {
        audio.play('menu_select');
        menu.restartLevel();
    });
    document.getElementById('btn-quit')?.addEventListener('click', () => {
        audio.play('menu_select');
        menu.showMenu();
    });

    // Complete overlay buttons
    document.getElementById('btn-complete-restart')?.addEventListener('click', () => {
        audio.play('menu_select');
        menu.restartLevel();
    });
    document.getElementById('btn-complete-menu')?.addEventListener('click', () => {
        audio.play('menu_select');
        menu.showMenu();
    });

    requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
    if (lastTime === 0) lastTime = timestamp;
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    gameTime += delta / 1000;

    accumulator += Math.min(delta, 100);

    const state = getState();

    if (state.phase === GAME_STATE.MENU) {
        renderMenuBackground(gameTime);
        clearInputState();
        accumulator = 0;
    } else {
        while (accumulator >= PHYSICS_DT) {
            const dt = PHYSICS_DT / 1000;
            update(dt);
            accumulator -= PHYSICS_DT;
        }
        render(accumulator / PHYSICS_DT, gameTime);
    }

    requestAnimationFrame(gameLoop);
}

function update(dt) {
    const state = getState();

    // Escape for pause
    if (consumeEscape()) {
        if (state.phase === GAME_STATE.PLAYING) {
            setState({ phase: GAME_STATE.PAUSED });
            menu.showPause();
            audio.stopMusic();
            return;
        } else if (state.phase === GAME_STATE.PAUSED) {
            setState({ phase: GAME_STATE.PLAYING });
            menu.hidePause();
            audio.startMusic(120);
            return;
        }
    }

    if (state.phase === GAME_STATE.PAUSED) return;

    if (state.phase === GAME_STATE.DEAD) {
        updateDeath(dt);
        particles.update(dt);
        effects.update(dt);
        updateShake(dt);
        return;
    }

    if (state.phase === GAME_STATE.LEVEL_COMPLETE) {
        particles.update(dt);
        effects.update(dt);
        return;
    }

    if (state.phase !== GAME_STATE.PLAYING) return;

    // Scroll
    state.scrollX += state.currentSpeed * dt;

    // Update player
    updatePlayer(dt, audio);

    // Update zone banner
    updateZoneBanner(dt);

    // Update obstacles
    for (const obs of state.obstacles) {
        if (obs.update) obs.update(dt);
    }

    // Update portals
    for (const portal of state.portals) {
        portal.update(dt);

        // Check if player passed through portal
        if (!state.triggeredPortals.has(portal) &&
            state.scrollX + PHYSICS.PLAYER_START_X > portal.x - 15 &&
            state.scrollX + PHYSICS.PLAYER_START_X < portal.x + 30) {
            state.triggeredPortals.add(portal);
            activatePortal(portal, audio);
        }
    }

    // Update jump orbs and check proximity
    const player = getPlayer();
    player.nearJumpOrb = null;
    for (const orb of state.jumpOrbs) {
        orb.update(dt);
        if (!orb.used && !player.grounded) {
            const bounds = getPlayerBounds();
            if (orb.isPlayerInRange(bounds)) {
                player.nearJumpOrb = orb;
            }
        }
    }

    // Check speed zones
    if (state.speedZones) {
        for (const zone of state.speedZones) {
            if (!state.triggeredSpeedZones.has(zone) &&
                state.scrollX + PHYSICS.PLAYER_START_X > zone.x) {
                state.triggeredSpeedZones.add(zone);
                state.currentSpeed = zone.speed;
            }
        }
    }

    // Collision detection
    const playerBounds = getPlayerBounds();
    for (const obs of state.obstacles) {
        if (checkCollision(playerBounds, obs)) {
            die();
            return;
        }
    }

    // Check level completion
    if (state.scrollX >= state.levelLength) {
        completeLevel();
        return;
    }

    // Update progress tracking
    const progress = getProgress();
    if (progress > state.bestProgress) {
        state.bestProgress = progress;
        storage.saveLevelScore(state.levelIndex, progress, state.attemptNumber);
    }

    // Update effects & particles
    particles.update(dt);
    effects.update(dt);
    updateShake(dt);
}

function die() {
    const state = getState();
    const player = getPlayer();

    setPlayer({ dead: true });
    setState({ phase: GAME_STATE.DEAD, deathTimer: 0, deathPhase: 'flash' });

    // Effects
    effects.triggerFlash(DEATH.FLASH_DURATION, 'rgba(255, 100, 100, 0.8)');
    triggerShake(DEATH.SHAKE_INTENSITY, DEATH.SHAKE_DURATION);
    particles.spawnDeathBurst(
        player.x + state.scrollX + PHYSICS.PLAYER_SIZE / 2,
        player.y + PHYSICS.PLAYER_SIZE / 2,
        '#4488ff'
    );

    audio.play('death');
    audio.stopMusic();
}

function updateDeath(dt) {
    const state = getState();
    state.deathTimer += dt;

    if (state.deathTimer < DEATH.FREEZE_DURATION) {
        // Freeze phase - do nothing, let particles and effects animate
        return;
    }

    if (state.deathPhase === 'flash') {
        state.deathPhase = 'fade';
        effects.triggerFadeOut(DEATH.FADE_DURATION);
    }

    if (state.deathTimer >= DEATH.TOTAL_DURATION) {
        // Reset
        const levelIdx = state.levelIndex;
        resetLevel();
        loadLevel(levelIdx);
        setState({ phase: GAME_STATE.PLAYING });
        effects.triggerFadeIn(0.3);
        particles.clear();
        clearInputState();
        audio.startMusic(120);
    }
}

function completeLevel() {
    const state = getState();
    setState({ phase: GAME_STATE.LEVEL_COMPLETE });
    storage.saveLevelScore(state.levelIndex, 100, state.attemptNumber);
    menu.showComplete();
    audio.stopMusic();
}

// Boot
document.addEventListener('DOMContentLoaded', init);
