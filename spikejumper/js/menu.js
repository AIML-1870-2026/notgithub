// ── Menu System ──

import { GAME_STATE, MENU_SCREEN } from './config.js';
import { getState, setState, startFreshLevel } from './gameState.js';
import { loadLevel, getLevelName, getLevelCount } from './level.js';
import * as storage from './storage.js';
import * as audio from './audio.js';

let currentScreen = MENU_SCREEN.TITLE;
const overlay = () => document.getElementById('menu-overlay');
const pauseOverlay = () => document.getElementById('pause-overlay');
const completeOverlay = () => document.getElementById('complete-overlay');

export function initMenu() {
    updateScreen(MENU_SCREEN.TITLE);
    const state = getState();
    const saved = storage.getSettings();
    state.settings = { ...state.settings, ...saved };
}

export function showMenu() {
    setState({ phase: GAME_STATE.MENU });
    updateScreen(MENU_SCREEN.TITLE);
    overlay().classList.add('visible');
    pauseOverlay().classList.remove('visible');
    completeOverlay().classList.remove('visible');
    audio.stopMusic();
}

export function hideMenu() {
    overlay().classList.remove('visible');
}

export function showPause() {
    pauseOverlay().classList.add('visible');
}

export function hidePause() {
    pauseOverlay().classList.remove('visible');
}

export function showComplete() {
    const state = getState();
    completeOverlay().classList.add('visible');
    const nameEl = document.getElementById('complete-level-name');
    const attEl = document.getElementById('complete-attempts');
    if (nameEl) nameEl.textContent = getLevelName(state.levelIndex);
    if (attEl) attEl.textContent = state.attemptNumber;
    storage.saveLevelScore(state.levelIndex, 100, state.attemptNumber);
    audio.play('level_complete');
}

export function hideComplete() {
    completeOverlay().classList.remove('visible');
}

function updateScreen(screen) {
    currentScreen = screen;
    const el = overlay();
    el.innerHTML = '';
    el.classList.add('visible');

    switch (screen) {
        case MENU_SCREEN.TITLE: renderTitleScreen(el); break;
        case MENU_SCREEN.SETTINGS: renderSettingsScreen(el); break;
        case MENU_SCREEN.LEVEL_SELECT: renderLevelSelect(el); break;
        case MENU_SCREEN.HIGH_SCORES: renderHighScores(el); break;
    }
}

function renderTitleScreen(el) {
    el.innerHTML = `
        <div class="menu-content title-screen">
            <div class="title-hero">
                <img src="assets/PixelElmwoodEntrance.jpg" alt="Elmwood Park Entrance" class="title-hero-img">
                <div class="title-hero-overlay"></div>
            </div>
            <div class="title-body">
                <h1 class="game-title">SPIKE<span class="title-accent">JUMPER</span></h1>
                <p class="title-subtitle">Navigate the neon gauntlet</p>
                <div class="menu-buttons">
                    <button class="menu-btn primary" id="btn-play">
                        <span class="btn-icon">&#9654;</span> PLAY
                    </button>
                    <button class="menu-btn" id="btn-level-select">
                        <span class="btn-icon">&#9776;</span> LEVELS
                    </button>
                    <button class="menu-btn" id="btn-settings">
                        <span class="btn-icon">&#9881;</span> SETTINGS
                    </button>
                    <button class="menu-btn" id="btn-scores">
                        <span class="btn-icon">&#9733;</span> SCORES
                    </button>
                </div>
                <p class="controls-hint">SPACE or TAP to jump</p>
            </div>
        </div>
    `;

    el.querySelector('#btn-play').addEventListener('click', () => {
        audio.initAudio();
        audio.resumeContext();
        audio.play('menu_select');
        startGame(0);
    });
    el.querySelector('#btn-level-select').addEventListener('click', () => {
        audio.play('menu_select');
        updateScreen(MENU_SCREEN.LEVEL_SELECT);
    });
    el.querySelector('#btn-settings').addEventListener('click', () => {
        audio.play('menu_select');
        updateScreen(MENU_SCREEN.SETTINGS);
    });
    el.querySelector('#btn-scores').addEventListener('click', () => {
        audio.play('menu_select');
        updateScreen(MENU_SCREEN.HIGH_SCORES);
    });

    // Hover sounds
    el.querySelectorAll('.menu-btn').forEach(btn => {
        btn.addEventListener('mouseenter', () => audio.play('menu_hover'));
    });
}

function renderSettingsScreen(el) {
    const state = getState();
    el.innerHTML = `
        <div class="menu-content settings-screen">
            <h2 class="screen-title">SETTINGS</h2>
            <div class="settings-group">
                <label class="setting-label">
                    <span>Master Volume</span>
                    <input type="range" id="vol-master" min="0" max="100" value="${Math.round(state.settings.masterVolume * 100)}">
                    <span class="vol-value" id="vol-master-val">${Math.round(state.settings.masterVolume * 100)}%</span>
                </label>
                <label class="setting-label">
                    <span>SFX Volume</span>
                    <input type="range" id="vol-sfx" min="0" max="100" value="${Math.round(state.settings.sfxVolume * 100)}">
                    <span class="vol-value" id="vol-sfx-val">${Math.round(state.settings.sfxVolume * 100)}%</span>
                </label>
                <label class="setting-label">
                    <span>Music Volume</span>
                    <input type="range" id="vol-music" min="0" max="100" value="${Math.round(state.settings.musicVolume * 100)}">
                    <span class="vol-value" id="vol-music-val">${Math.round(state.settings.musicVolume * 100)}%</span>
                </label>
            </div>
            <div class="settings-group">
                <h3 class="settings-subhead">Controls</h3>
                <p class="controls-info">SPACE / Arrow Up — Jump</p>
                <p class="controls-info">ESC — Pause</p>
                <p class="controls-info">Touch / Tap — Jump (Mobile)</p>
            </div>
            <button class="menu-btn" id="btn-back">&#8592; BACK</button>
        </div>
    `;

    const masterSlider = el.querySelector('#vol-master');
    const sfxSlider = el.querySelector('#vol-sfx');
    const musicSlider = el.querySelector('#vol-music');

    const updateVolumes = () => {
        const m = masterSlider.value / 100;
        const s = sfxSlider.value / 100;
        const mu = musicSlider.value / 100;
        state.settings.masterVolume = m;
        state.settings.sfxVolume = s;
        state.settings.musicVolume = mu;
        audio.setVolume(m, s, mu);
        storage.saveSettings(state.settings);
        el.querySelector('#vol-master-val').textContent = `${masterSlider.value}%`;
        el.querySelector('#vol-sfx-val').textContent = `${sfxSlider.value}%`;
        el.querySelector('#vol-music-val').textContent = `${musicSlider.value}%`;
    };

    masterSlider.addEventListener('input', updateVolumes);
    sfxSlider.addEventListener('input', updateVolumes);
    musicSlider.addEventListener('input', updateVolumes);

    el.querySelector('#btn-back').addEventListener('click', () => {
        audio.play('menu_select');
        updateScreen(MENU_SCREEN.TITLE);
    });
}

function renderLevelSelect(el) {
    const count = getLevelCount();
    let levelsHTML = '';
    for (let i = 0; i < count; i++) {
        const score = storage.getBestScore(i);
        const name = getLevelName(i);
        const pct = Math.floor(score.bestProgress);
        const completed = score.completed;
        levelsHTML += `
            <button class="level-card ${completed ? 'completed' : ''}" data-level="${i}">
                <div class="level-card-name">${name}</div>
                <div class="level-card-progress">
                    <div class="level-progress-bar" style="width: ${pct}%"></div>
                </div>
                <div class="level-card-pct">${pct}%${completed ? ' &#10003;' : ''}</div>
            </button>
        `;
    }

    el.innerHTML = `
        <div class="menu-content level-select-screen">
            <h2 class="screen-title">SELECT LEVEL</h2>
            <div class="level-grid">${levelsHTML}</div>
            <button class="menu-btn" id="btn-back">&#8592; BACK</button>
        </div>
    `;

    el.querySelectorAll('.level-card').forEach(card => {
        card.addEventListener('click', () => {
            audio.initAudio();
            audio.resumeContext();
            audio.play('menu_select');
            startGame(parseInt(card.dataset.level));
        });
        card.addEventListener('mouseenter', () => audio.play('menu_hover'));
    });

    el.querySelector('#btn-back').addEventListener('click', () => {
        audio.play('menu_select');
        updateScreen(MENU_SCREEN.TITLE);
    });
}

function renderHighScores(el) {
    const scores = storage.getAllScores();
    const count = getLevelCount();
    let rows = '';
    for (let i = 0; i < count; i++) {
        const score = scores[i] || { bestProgress: 0, bestAttempts: 0, completed: false };
        const name = getLevelName(i);
        rows += `
            <div class="score-row">
                <span class="score-name">${name}</span>
                <span class="score-pct">${Math.floor(score.bestProgress)}%</span>
                <span class="score-attempts">${score.completed ? score.bestAttempts + ' att.' : '—'}</span>
                <span class="score-status">${score.completed ? '&#10003;' : '&#10007;'}</span>
            </div>
        `;
    }

    el.innerHTML = `
        <div class="menu-content scores-screen">
            <h2 class="screen-title">HIGH SCORES</h2>
            <div class="scores-list">
                <div class="score-header">
                    <span>Level</span><span>Best</span><span>Attempts</span><span></span>
                </div>
                ${rows || '<p class="no-scores">No scores yet. Go play!</p>'}
            </div>
            <button class="menu-btn" id="btn-back">&#8592; BACK</button>
        </div>
    `;

    el.querySelector('#btn-back').addEventListener('click', () => {
        audio.play('menu_select');
        updateScreen(MENU_SCREEN.TITLE);
    });
}

function startGame(levelIndex) {
    loadLevel(levelIndex);
    startFreshLevel(levelIndex);
    hideMenu();
    audio.startMusic(120);
}

export function restartLevel() {
    const state = getState();
    hidePause();
    hideComplete();
    loadLevel(state.levelIndex);
    startFreshLevel(state.levelIndex);
    audio.stopMusic();
    audio.startMusic(120);
}

export function getCurrentScreen() {
    return currentScreen;
}
