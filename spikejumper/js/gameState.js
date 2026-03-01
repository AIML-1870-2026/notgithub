// ── Central Game State Store ──

import { GAME_STATE, PHYSICS, AUDIO } from './config.js';

const defaultPlayerState = () => ({
    x: PHYSICS.PLAYER_START_X,
    y: PHYSICS.GROUND_Y - PHYSICS.PLAYER_SIZE,
    vy: 0,
    grounded: true,
    gravityFlipped: false,
    nearJumpOrb: null,
    isDashing: false,
    dashTimer: 0,
    scaleX: 1,
    scaleY: 1,
    targetScaleX: 1,
    targetScaleY: 1,
    eyeLookX: 0.3,
    eyeLookY: 0,
    dead: false,
    rotation: 0
});

const state = {
    phase: GAME_STATE.MENU,
    levelIndex: 0,
    scrollX: 0,
    baseSpeed: 420,
    currentSpeed: 420,
    attemptNumber: 1,
    bestProgress: 0,
    levelLength: 12000,
    player: defaultPlayerState(),
    deathTimer: 0,
    deathPhase: null,
    obstacles: [],
    portals: [],
    jumpOrbs: [],
    triggeredPortals: new Set(),
    triggeredSpeedZones: new Set(),
    settings: {
        masterVolume: AUDIO.DEFAULT_MASTER,
        sfxVolume: AUDIO.DEFAULT_SFX,
        musicVolume: AUDIO.DEFAULT_MUSIC,
        jumpKey: ' '
    },
    scores: {},
    // Zone banner state
    sections: [],
    currentSectionIndex: -1,
    zoneBanner: { active: false, timer: 0, name: '', hint: '' }
};

export function getState() {
    return state;
}

export function setState(updates) {
    Object.assign(state, updates);
}

export function getPlayer() {
    return state.player;
}

export function setPlayer(updates) {
    Object.assign(state.player, updates);
}

export function resetLevel() {
    state.scrollX = 0;
    state.currentSpeed = state.baseSpeed;
    state.player = defaultPlayerState();
    state.deathTimer = 0;
    state.deathPhase = null;
    state.triggeredPortals = new Set();
    state.triggeredSpeedZones = new Set();
    for (const orb of state.jumpOrbs) orb.reset();
    state.attemptNumber++;
    state.currentSectionIndex = -1;
    state.zoneBanner = { active: false, timer: 0, name: '', hint: '' };
}

export function startFreshLevel(levelIndex) {
    state.levelIndex = levelIndex;
    state.scrollX = 0;
    state.currentSpeed = state.baseSpeed;
    state.player = defaultPlayerState();
    state.deathTimer = 0;
    state.deathPhase = null;
    state.triggeredPortals = new Set();
    state.triggeredSpeedZones = new Set();
    for (const orb of state.jumpOrbs) orb.reset();
    state.attemptNumber = 1;
    state.bestProgress = 0;
    state.phase = GAME_STATE.PLAYING;
    state.currentSectionIndex = -1;
    state.zoneBanner = { active: false, timer: 0, name: '', hint: '' };
}

export function getProgress() {
    if (state.levelLength <= 0) return 0;
    return Math.min(100, (state.scrollX / state.levelLength) * 100);
}
