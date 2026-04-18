// input.js — Event wiring for UI controls (agent-focused)

import { getDom } from './ui.js';
import { AGENT_MODE } from './config.js';

let callbacks = {};

export function setCallbacks(cb) {
    callbacks = cb;
}

export function initInput() {
    const dom = getDom();

    // Paste input — Load button
    dom.btnKeyLoad.addEventListener('click', () => {
        const raw = dom.apiKeyInput.value.trim();
        if (raw) callbacks.onKeyString?.(raw);
    });

    // Paste input — Enter key
    dom.apiKeyInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            const raw = dom.apiKeyInput.value.trim();
            if (raw) callbacks.onKeyString?.(raw);
        }
    });

    // Clear key button
    dom.btnKeyClear.addEventListener('click', () => callbacks.onKeyClear?.());

    // .env drag-and-drop + click on drop zone
    dom.envDrop.addEventListener('click', () => dom.envInput.click());
    dom.envInput.addEventListener('change', e => {
        const file = e.target.files[0];
        if (file) callbacks.onEnvFile?.(file);
        e.target.value = '';
    });
    dom.envDrop.addEventListener('dragover', e => {
        e.preventDefault();
        dom.envDrop.classList.add('drag-over');
    });
    dom.envDrop.addEventListener('dragleave', () => dom.envDrop.classList.remove('drag-over'));
    dom.envDrop.addEventListener('drop', e => {
        e.preventDefault();
        dom.envDrop.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file) callbacks.onEnvFile?.(file);
    });

    // Mode toggle (Auto ↔ Step)
    dom.modeToggle.addEventListener('click', () => callbacks.onModeToggle?.());

    // Betting chips
    document.getElementById('chip-rack').addEventListener('click', e => {
        const chip = e.target.closest('[data-value]');
        if (chip) callbacks.onChip?.(Number(chip.dataset.value));
    });

    // Clear bet
    dom.btnClearBet.addEventListener('click', () => callbacks.onClearBet?.());

    // Deal
    dom.btnDeal.addEventListener('click', () => callbacks.onDeal?.());

    // New round
    dom.btnNewRound.addEventListener('click', () => callbacks.onNewRound?.());

    // Insurance
    dom.btnInsuranceYes.addEventListener('click', () => callbacks.onInsuranceYes?.());
    dom.btnInsuranceNo.addEventListener('click',  () => callbacks.onInsuranceNo?.());

    // Execute (step mode)
    dom.btnExecute.addEventListener('click', () => callbacks.onExecute?.());

    // Explainability level
    dom.explainControl.addEventListener('click', e => {
        const btn = e.target.closest('[data-value]');
        if (btn) callbacks.onExplainLevel?.(btn.dataset.value);
    });

    // Risk profile
    dom.riskControl.addEventListener('click', e => {
        const btn = e.target.closest('[data-value]');
        if (btn) callbacks.onRiskProfile?.(btn.dataset.value);
    });

    // Settings toggles
    dom.settingSound.addEventListener('change', () =>
        callbacks.onSetting?.('soundEnabled', dom.settingSound.checked));
    dom.settingCount.addEventListener('change', () =>
        callbacks.onSetting?.('countEnabled', dom.settingCount.checked));
    dom.settingAutodeal.addEventListener('change', () =>
        callbacks.onSetting?.('autoDeal', dom.settingAutodeal.checked));

    // Header modals
    document.getElementById('btn-analytics').addEventListener('click', () => callbacks.onOpenAnalytics?.());
    document.getElementById('btn-analytics-expand').addEventListener('click', () => callbacks.onOpenAnalytics?.());
    document.getElementById('btn-settings').addEventListener('click', () => callbacks.onOpenSettings?.());
    document.getElementById('analytics-modal-close').addEventListener('click', () => callbacks.onCloseAnalytics?.());
    document.getElementById('settings-modal-close').addEventListener('click', () => callbacks.onCloseSettings?.());
    document.getElementById('btn-reset-analytics').addEventListener('click', () => callbacks.onResetAnalytics?.());

    // Close modals on overlay click
    document.getElementById('analytics-modal').addEventListener('click', e => {
        if (e.target === e.currentTarget) callbacks.onCloseAnalytics?.();
    });
    document.getElementById('settings-modal').addEventListener('click', e => {
        if (e.target === e.currentTarget) callbacks.onCloseSettings?.();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', e => {
        if (e.target.tagName === 'INPUT') return;
        switch (e.key) {
            case ' ':
            case 'Enter':
                e.preventDefault();
                callbacks.onExecute?.();
                break;
            case 'a':
            case 'A':
                callbacks.onModeToggle?.();
                break;
            case 'n':
            case 'N':
                callbacks.onNewRound?.();
                break;
            case 'Escape':
                callbacks.onCloseAnalytics?.();
                callbacks.onCloseSettings?.();
                break;
        }
    });
}
