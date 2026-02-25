// input.js — Click handlers, keyboard shortcuts, event delegation

import { GAME_PHASE } from './config.js';
import { getState, setState } from './gameState.js';
import { play } from './sound.js';
import {
    showStatsModal, hideStatsModal,
    showSettingsModal, hideSettingsModal,
    updateCoachButton
} from './ui.js';
import { resetStats } from './stats.js';

// Game action callbacks — set by main.js
let onHit = null;
let onStand = null;
let onDouble = null;
let onSplit = null;
let onDeal = null;
let onNewRound = null;
let onChipClick = null;
let onClearBet = null;
let onInsuranceYes = null;
let onInsuranceNo = null;
let onCoachToggle = null;

export function setCallbacks(callbacks) {
    onHit = callbacks.onHit;
    onStand = callbacks.onStand;
    onDouble = callbacks.onDouble;
    onSplit = callbacks.onSplit;
    onDeal = callbacks.onDeal;
    onNewRound = callbacks.onNewRound;
    onChipClick = callbacks.onChipClick;
    onClearBet = callbacks.onClearBet;
    onInsuranceYes = callbacks.onInsuranceYes;
    onInsuranceNo = callbacks.onInsuranceNo;
    onCoachToggle = callbacks.onCoachToggle;
}

export function initInput() {
    // Action buttons
    document.getElementById('btn-hit').addEventListener('click', () => {
        play('button');
        onHit?.();
    });

    document.getElementById('btn-stand').addEventListener('click', () => {
        play('button');
        onStand?.();
    });

    document.getElementById('btn-double').addEventListener('click', () => {
        play('button');
        onDouble?.();
    });

    document.getElementById('btn-split').addEventListener('click', () => {
        play('button');
        onSplit?.();
    });

    // Deal / New Round
    document.getElementById('btn-deal').addEventListener('click', () => {
        play('button');
        onDeal?.();
    });

    document.getElementById('btn-new-round').addEventListener('click', () => {
        play('button');
        onNewRound?.();
    });

    // Chip clicks
    document.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const value = parseInt(chip.dataset.value);
            play('chip-place');
            onChipClick?.(value);
        });
    });

    // Clear bet
    document.getElementById('btn-clear-bet').addEventListener('click', () => {
        play('button');
        onClearBet?.();
    });

    // Insurance
    document.getElementById('btn-insurance-yes').addEventListener('click', () => {
        play('button');
        onInsuranceYes?.();
    });

    document.getElementById('btn-insurance-no').addEventListener('click', () => {
        play('button');
        onInsuranceNo?.();
    });

    // Coach toggle
    document.getElementById('btn-coach').addEventListener('click', () => {
        play('button');
        const state = getState();
        const nowEnabled = !state.settings.coachEnabled;
        setState({
            settings: { ...state.settings, coachEnabled: nowEnabled }
        });
        updateCoachButton();
        onCoachToggle?.(nowEnabled);
    });

    // Stats modal
    document.getElementById('btn-stats').addEventListener('click', () => {
        play('button');
        showStatsModal();
    });

    document.getElementById('close-stats').addEventListener('click', () => {
        hideStatsModal();
    });

    document.getElementById('btn-reset-stats').addEventListener('click', () => {
        if (confirm('Reset all statistics?')) {
            resetStats();
            showStatsModal(); // Refresh
        }
    });

    // Settings modal
    document.getElementById('btn-settings').addEventListener('click', () => {
        play('button');
        showSettingsModal();
    });

    document.getElementById('close-settings').addEventListener('click', () => {
        hideSettingsModal();
    });

    // Settings controls
    document.getElementById('setting-sound').addEventListener('change', (e) => {
        const state = getState();
        setState({
            settings: { ...state.settings, soundEnabled: e.target.checked }
        });
        if (e.target.checked) {
            import('./sound.js').then(m => m.unmute());
        } else {
            import('./sound.js').then(m => m.mute());
        }
    });

    document.getElementById('setting-coach').addEventListener('change', (e) => {
        const state = getState();
        setState({
            settings: { ...state.settings, coachEnabled: e.target.checked }
        });
        updateCoachButton();
        onCoachToggle?.(e.target.checked);
    });

    document.getElementById('setting-count').addEventListener('change', (e) => {
        const state = getState();
        setState({
            settings: { ...state.settings, countEnabled: e.target.checked }
        });
    });

    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.add('hidden');
            }
        });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);
}

function handleKeyboard(e) {
    // Ignore if typing in input/select
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

    // Close modals on Escape
    if (e.key === 'Escape') {
        hideStatsModal();
        hideSettingsModal();
        return;
    }

    const key = e.key.toLowerCase();
    const { phase } = getState();

    switch (key) {
        case 'h':
            if (phase === GAME_PHASE.PLAYER_TURN || phase === GAME_PHASE.SPLIT_TURN) {
                play('button');
                onHit?.();
            }
            break;

        case 's':
            if (phase === GAME_PHASE.PLAYER_TURN || phase === GAME_PHASE.SPLIT_TURN) {
                play('button');
                onStand?.();
            }
            break;

        case 'd':
            if (phase === GAME_PHASE.PLAYER_TURN || phase === GAME_PHASE.SPLIT_TURN) {
                play('button');
                onDouble?.();
            }
            break;

        case 'p':
            if (phase === GAME_PHASE.PLAYER_TURN || phase === GAME_PHASE.SPLIT_TURN) {
                play('button');
                onSplit?.();
            }
            break;

        case 'n':
            if (phase === GAME_PHASE.BETTING) {
                play('button');
                onDeal?.();
            } else if (phase === GAME_PHASE.RESOLUTION) {
                play('button');
                onNewRound?.();
            }
            break;

        case 'i':
            if (phase === GAME_PHASE.INSURANCE) {
                play('button');
                onInsuranceYes?.();
            }
            break;
    }
}
