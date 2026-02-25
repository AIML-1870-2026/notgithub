// ui.js — All DOM rendering (sole DOM writer)

import { GAME_PHASE, OUTCOME } from './config.js';
import { getState } from './gameState.js';
import { canHit, canStand, canDoubleDown, canSplit } from './player.js';
import { isValidBet, getOutcomeMessage } from './betting.js';
import { getStats, getHistory } from './stats.js';
import { getRunningCount } from './cardCount.js';
import {
    dealCardAnimation, flipCardAnimation, scorePopAnimation,
    shakeAnimation, winPulseAnimation, createParticleBurst,
    messageAppearAnimation
} from './animations.js';

// Cached DOM references
const dom = {};

export function initUI() {
    dom.dealerCards = document.getElementById('dealer-cards');
    dom.playerCards = document.getElementById('player-cards');
    dom.dealerScore = document.getElementById('dealer-score');
    dom.playerScore = document.getElementById('player-score');
    dom.gameMessage = document.getElementById('game-message');
    dom.messageArea = document.getElementById('message-area');
    dom.handTabs = document.getElementById('hand-tabs');

    // Coach
    dom.coachCard = document.getElementById('coach-card');
    dom.coachAction = document.getElementById('coach-action');
    dom.coachReason = document.getElementById('coach-reason');
    dom.coachFeedback = document.getElementById('coach-feedback');
    dom.btnCoach = document.getElementById('btn-coach');

    // Buttons
    dom.btnHit = document.getElementById('btn-hit');
    dom.btnStand = document.getElementById('btn-stand');
    dom.btnDouble = document.getElementById('btn-double');
    dom.btnSplit = document.getElementById('btn-split');
    dom.btnDeal = document.getElementById('btn-deal');
    dom.btnNewRound = document.getElementById('btn-new-round');
    dom.btnClearBet = document.getElementById('btn-clear-bet');
    dom.btnStats = document.getElementById('btn-stats');
    dom.btnSettings = document.getElementById('btn-settings');

    // Insurance
    dom.insurancePrompt = document.getElementById('insurance-prompt');
    dom.btnInsuranceYes = document.getElementById('btn-insurance-yes');
    dom.btnInsuranceNo = document.getElementById('btn-insurance-no');

    // Betting
    dom.betAmount = document.getElementById('bet-amount');
    dom.bankrollAmount = document.getElementById('bankroll-amount');
    dom.bettingArea = document.getElementById('betting-area');
    dom.chipRack = document.getElementById('chip-rack');

    // Info displays
    dom.runningCount = document.getElementById('running-count');
    dom.cardsRemaining = document.getElementById('cards-remaining');
    dom.countDisplay = document.getElementById('count-display');

    // Modals
    dom.statsModal = document.getElementById('stats-modal');
    dom.settingsModal = document.getElementById('settings-modal');

    // Stats elements
    dom.statHands = document.getElementById('stat-hands');
    dom.statWins = document.getElementById('stat-wins');
    dom.statLosses = document.getElementById('stat-losses');
    dom.statPushes = document.getElementById('stat-pushes');
    dom.statBlackjacks = document.getElementById('stat-blackjacks');
    dom.statWinrate = document.getElementById('stat-winrate');
    dom.statStreak = document.getElementById('stat-streak');
    dom.statBestStreak = document.getElementById('stat-best-streak');
    dom.statBiggestWin = document.getElementById('stat-biggest-win');
    dom.statNetProfit = document.getElementById('stat-net-profit');
    dom.historyList = document.getElementById('history-list');
}

// --- Card Rendering ---

function createCardElement(card) {
    const el = document.createElement('div');
    el.className = 'card';

    if (card.faceUp) {
        el.innerHTML = `<img src="${card.imagePath}" alt="${card.toString()}">`;
    } else {
        el.classList.add('card-back');
    }

    return el;
}

export async function renderDealerHand(animate = false) {
    const { dealerHand } = getState();
    dom.dealerCards.innerHTML = '';

    for (const card of dealerHand.cards) {
        const el = createCardElement(card);
        dom.dealerCards.appendChild(el);
        if (animate) await dealCardAnimation(el);
    }

    updateDealerScore();
}

export async function renderPlayerHand(animate = false) {
    const { playerHands, currentHandIndex } = getState();
    dom.playerCards.innerHTML = '';

    const hand = playerHands[currentHandIndex];
    if (!hand) return;

    for (const card of hand.cards) {
        const el = createCardElement(card);
        dom.playerCards.appendChild(el);
        if (animate) await dealCardAnimation(el);
    }

    updatePlayerScore();
    renderHandTabs();
}

export async function addCardToPlayerHand(card, animate = true) {
    const el = createCardElement(card);
    dom.playerCards.appendChild(el);
    if (animate) await dealCardAnimation(el);
    updatePlayerScore();
}

export async function addCardToDealerHand(card, animate = true) {
    const el = createCardElement(card);
    dom.dealerCards.appendChild(el);
    if (animate) await dealCardAnimation(el);
    updateDealerScore();
}

export async function flipDealerHoleCard(card) {
    const cards = dom.dealerCards.querySelectorAll('.card');
    const holeCardEl = cards[1]; // Second card is hole card
    if (holeCardEl) {
        await flipCardAnimation(holeCardEl, card.imagePath);
    }
    updateDealerScore();
}

// --- Score Display ---

function updateDealerScore() {
    const { dealerHand } = getState();

    if (dealerHand.cards.length === 0) {
        dom.dealerScore.textContent = '\u2014';
        return;
    }

    // If any card is face-down, only show the visible score
    const hasHiddenCard = dealerHand.cards.some(c => !c.faceUp);
    if (hasHiddenCard) {
        const visible = dealerHand.visibleScore;
        dom.dealerScore.textContent = visible > 0 ? visible : '?';
    } else {
        dom.dealerScore.textContent = dealerHand.score;
    }

    scorePopAnimation(dom.dealerScore);
}

function updatePlayerScore() {
    const hand = getState().playerHands[getState().currentHandIndex];
    if (!hand || hand.cards.length === 0) {
        dom.playerScore.textContent = '\u2014';
        return;
    }

    const { total, isSoft } = hand.getScore();
    dom.playerScore.textContent = isSoft ? `${total}` : total;

    scorePopAnimation(dom.playerScore);
}

// --- Hand Tabs (for split hands) ---

function renderHandTabs() {
    const { playerHands, currentHandIndex } = getState();
    dom.handTabs.innerHTML = '';

    if (playerHands.length <= 1) return;

    playerHands.forEach((hand, i) => {
        const tab = document.createElement('div');
        tab.className = 'hand-tab' + (i === currentHandIndex ? ' active' : '');
        tab.textContent = `Hand ${i + 1}`;
        dom.handTabs.appendChild(tab);
    });
}

// --- Button States ---

export function updateButtons() {
    const state = getState();
    const { phase } = state;

    const isBetting = phase === GAME_PHASE.BETTING;
    const isPlayerTurn = phase === GAME_PHASE.PLAYER_TURN || phase === GAME_PHASE.SPLIT_TURN;
    const isResolution = phase === GAME_PHASE.RESOLUTION;
    const isInsurance = phase === GAME_PHASE.INSURANCE;

    // Action buttons
    dom.btnHit.disabled = !isPlayerTurn || !canHit();
    dom.btnStand.disabled = !isPlayerTurn || !canStand();
    dom.btnDouble.disabled = !isPlayerTurn || !canDoubleDown();
    dom.btnSplit.disabled = !isPlayerTurn || !canSplit();

    // Deal / New Round
    dom.btnDeal.classList.toggle('hidden', !isBetting);
    dom.btnDeal.disabled = isBetting && !isValidBet();
    dom.btnNewRound.classList.toggle('hidden', !isResolution);

    // Betting controls
    const chips = dom.chipRack.querySelectorAll('.chip');
    chips.forEach(chip => {
        chip.disabled = !isBetting;
    });
    dom.btnClearBet.disabled = !isBetting;

    // Insurance prompt
    dom.insurancePrompt.classList.toggle('hidden', !isInsurance);
}

// --- Betting Display ---

export function updateBetDisplay() {
    const { currentBet, bankroll } = getState();
    dom.betAmount.textContent = `$${currentBet}`;
    dom.bankrollAmount.textContent = `$${bankroll.toLocaleString()}`;
}

// --- Messages ---

export function showMessage(text, type = '') {
    dom.gameMessage.textContent = text;
    dom.messageArea.className = 'message-strip';
    if (type) dom.messageArea.classList.add(type);
    messageAppearAnimation(dom.messageArea);
}

// --- Info Displays ---

export function updateCount() {
    const state = getState();
    dom.runningCount.textContent = getRunningCount();
    dom.countDisplay.classList.toggle('hidden', !state.settings.countEnabled);
}

export function updateShoeInfo() {
    const { shoe } = getState();
    if (shoe) {
        dom.cardsRemaining.textContent = shoe.cardsRemaining;
    }
}

// --- Coach Display ---

export function showCoachAdvice(advice) {
    if (!advice) {
        hideCoach();
        return;
    }

    dom.coachAction.textContent = advice.action;
    dom.coachReason.textContent = advice.message;
    dom.coachFeedback.classList.add('hidden');
    dom.coachFeedback.className = 'coach-feedback hidden';
    dom.coachCard.classList.remove('hidden');

    // Re-trigger animation
    dom.coachCard.style.animation = 'none';
    dom.coachCard.offsetHeight; // force reflow
    dom.coachCard.style.animation = '';
}

export function showCoachFeedback(feedback) {
    if (!feedback) return;

    dom.coachFeedback.textContent = feedback.message;
    dom.coachFeedback.className = 'coach-feedback ' + feedback.type;
    dom.coachFeedback.classList.remove('hidden');
}

export function hideCoach() {
    dom.coachCard.classList.add('hidden');
}

export function updateCoachButton() {
    const state = getState();
    dom.btnCoach.classList.toggle('active', state.settings.coachEnabled);
}

// --- Stats Modal ---

export function renderStats() {
    const s = getStats();

    dom.statHands.textContent = s.handsPlayed;
    dom.statWins.textContent = s.wins;
    dom.statLosses.textContent = s.losses;
    dom.statPushes.textContent = s.pushes;
    dom.statBlackjacks.textContent = s.blackjacks;
    dom.statWinrate.textContent = `${s.winRate}%`;
    dom.statStreak.textContent = s.currentStreak;
    dom.statBestStreak.textContent = s.bestStreak;
    dom.statBiggestWin.textContent = `$${s.biggestWin}`;
    dom.statNetProfit.textContent = `$${s.netProfit}`;

    // Render history
    dom.historyList.innerHTML = '';
    const history = getHistory();
    for (let i = history.length - 1; i >= 0; i--) {
        const entry = history[i];
        const item = document.createElement('div');
        const cssClass = entry.profit > 0 ? 'win' : entry.profit < 0 ? 'lose' : 'push-result';
        item.className = `history-item ${cssClass}`;
        item.innerHTML = `
            <span>${getOutcomeMessage(entry.outcome)}</span>
            <span>${entry.profit >= 0 ? '+' : ''}$${entry.profit}</span>
        `;
        dom.historyList.appendChild(item);
    }
}

export function showStatsModal() {
    renderStats();
    dom.statsModal.classList.remove('hidden');
}

export function hideStatsModal() {
    dom.statsModal.classList.add('hidden');
}

export function showSettingsModal() {
    dom.settingsModal.classList.remove('hidden');
}

export function hideSettingsModal() {
    dom.settingsModal.classList.add('hidden');
}

// --- Visual effects for outcomes ---

export function showOutcomeEffects(outcome) {
    switch (outcome) {
        case OUTCOME.PLAYER_BLACKJACK:
            winPulseAnimation(dom.playerCards);
            createParticleBurst(
                dom.playerCards.getBoundingClientRect().left + dom.playerCards.offsetWidth / 2,
                dom.playerCards.getBoundingClientRect().top,
                '#e8a838', 16
            );
            break;

        case OUTCOME.PLAYER_WIN:
        case OUTCOME.DEALER_BUST:
            winPulseAnimation(dom.playerCards);
            createParticleBurst(
                dom.playerCards.getBoundingClientRect().left + dom.playerCards.offsetWidth / 2,
                dom.playerCards.getBoundingClientRect().top,
                '#4ade80', 10
            );
            break;

        case OUTCOME.PLAYER_BUST:
        case OUTCOME.DEALER_WIN:
        case OUTCOME.DEALER_BLACKJACK:
            shakeAnimation(dom.playerCards);
            break;
    }
}

// --- Full UI refresh ---

export function refreshUI() {
    updateButtons();
    updateBetDisplay();
    updateCount();
    updateShoeInfo();
    updateCoachButton();
}

// --- Clear table ---

export function clearTable() {
    dom.dealerCards.innerHTML = '';
    dom.playerCards.innerHTML = '';
    dom.dealerScore.textContent = '\u2014';
    dom.playerScore.textContent = '\u2014';
    dom.handTabs.innerHTML = '';
    hideCoach();
    dom.insurancePrompt.classList.add('hidden');
}
