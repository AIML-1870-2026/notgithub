// main.js — Agent orchestration and round lifecycle

import { GAME_PHASE, DEFAULTS, ACTION, OUTCOME, AGENT_MODE, AGENT_THINK_DELAY_MS, AUTO_DEAL_DELAY_MS } from './config.js';
import { getState, setState, subscribe, resetRound, resetGame, getCurrentHand } from './gameState.js';
import { Shoe } from './deck.js';
import { Hand } from './hand.js';
import { hit, stand, doubleDown, split, placeInsurance, advanceToNextHand, canHit, canStand, canDoubleDown, canSplit, canInsurance } from './player.js';
import { executeDealerTurn, getDealerUpCard } from './dealer.js';
import { placeBet, clearBet, resolveRound, isValidBet } from './betting.js';
import { updateCount, getTrueCount, getRunningCount, resetCount } from './cardCount.js';
import { getStats } from './stats.js';
import { play, mute, unmute, ensureInitialized } from './sound.js';
import { delay } from './animations.js';
import { getAgentDecision } from './agent.js';
import { parseEnvFile, loadKeyFromString, restoreStoredKey, clearStoredKey } from './envParser.js';
import { recordDecision } from './analytics.js';
import { getHintCode } from './strategy.js';
import {
    initUI, updateButtons, showMessage, showKeyLoaded, showKeyError, updateModeToggle,
    renderDealerHand, renderPlayerHand, addCardToDealer, addCardToPlayer,
    flipDealerHoleCard, updateShoeInfo, updateCountDisplay, refreshStrategyMatrix,
    refreshMatrixHighlight, showAgentThinking, showAgentDecision, showAgentIdle,
    showAgentError, updateAnalyticsBar, showAnalyticsModal, hideAnalyticsModal,
    showSettingsModal, hideSettingsModal, updateRiskDisplay, updateExplainDisplay,
    shakePlayerCards, pulseWin, getDom, clearKeyUI,
    clearCardRows, refreshScores
} from './ui.js';
import { setCallbacks, initInput } from './input.js';
import { resetAnalytics } from './analytics.js';

// ── State ────────────────────────────────────────────────────────
let isProcessing = false;
let autoDealEnabled = true;
let pendingExecute = null;
let lastBetAmount = 0;

// ── Init ─────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
    initUI();
    refreshStrategyMatrix();

    // Load settings from localStorage
    const savedSound = localStorage.getItem('bja_sound');
    const savedCount = localStorage.getItem('bja_count');
    const savedAutodeal = localStorage.getItem('bja_autodeal');
    if (savedSound === 'false') mute();
    if (savedCount !== 'false') setState({ settings: { ...getState().settings, countEnabled: true } });
    autoDealEnabled = savedAutodeal !== 'false';

    const dom = getDom();
    if (dom.settingSound)   dom.settingSound.checked   = savedSound !== 'false';
    if (dom.settingCount)   dom.settingCount.checked   = savedCount !== 'false';
    if (dom.settingAutodeal) dom.settingAutodeal.checked = autoDealEnabled;

    const shoe = new Shoe(DEFAULTS.NUM_DECKS);
    setState({ shoe });

    // Restore saved API key from localStorage
    const restored = restoreStoredKey();
    if (restored) showKeyLoaded(restored.provider, restored.masked);

    setCallbacks({
        onKeyString:     handleKeyString,
        onKeyClear:      handleKeyClear,
        onEnvFile:       handleEnvFile,
        onModeToggle:    handleModeToggle,
        onChip:          handleChip,
        onClearBet:      handleClearBet,
        onDeal:          handleDeal,
        onNewRound:      handleNewRound,
        onInsuranceYes:  handleInsuranceYes,
        onInsuranceNo:   handleInsuranceNo,
        onExecute:       handleExecute,
        onExplainLevel:  handleExplainLevel,
        onRiskProfile:   handleRiskProfile,
        onSetting:       handleSetting,
        onOpenAnalytics: () => showAnalyticsModal(),
        onCloseAnalytics: () => hideAnalyticsModal(),
        onOpenSettings:  () => showSettingsModal(),
        onCloseSettings: () => hideSettingsModal(),
        onResetAnalytics: handleResetAnalytics,
    });

    initInput();
    subscribe(onStateChange);

    updateButtons();
    updateShoeInfo();
    updateModeToggle(getState().agentMode);
    updateRiskDisplay(getState().riskProfile);
    updateExplainDisplay(getState().explainLevel);
    updateAnalyticsBar();
    showMessage('Load an API key to begin');
    showAgentIdle();
});

// ── State subscriber ────────────────────────────────────────────
function onStateChange(state) {
    updateButtons();
    updateShoeInfo();
    if (state.settings.countEnabled) {
        updateCountDisplay(getRunningCount(), getTrueCount(state.shoe?.cardsRemaining || 312));
    }
}

// ── Key handlers ─────────────────────────────────────────────────
function handleKeyString(raw) {
    try {
        const { provider, masked } = loadKeyFromString(raw);
        showKeyLoaded(provider, masked);
        showMessage('API key saved. Place a bet to start!');
        updateButtons();
    } catch (err) {
        showKeyError(err.message);
    }
}

function handleKeyClear() {
    clearStoredKey();
    clearKeyUI();
    showMessage('API key removed.');
    updateButtons();
}

// ── .env handler ────────────────────────────────────────────────
async function handleEnvFile(file) {
    try {
        const { provider, masked } = await parseEnvFile(file);
        showKeyLoaded(provider, masked);
        showMessage('API key saved. Place a bet to start!');
        updateButtons();
    } catch (err) {
        showKeyError(err.message);
    }
}

// ── Mode toggle ─────────────────────────────────────────────────
function handleModeToggle() {
    const current = getState().agentMode;
    const next = current === AGENT_MODE.AUTO ? AGENT_MODE.STEP : AGENT_MODE.AUTO;
    setState({ agentMode: next });
    updateModeToggle(next);
    updateButtons();
}

// ── Betting ─────────────────────────────────────────────────────
function handleChip(value) {
    ensureInitialized();
    if (getState().phase !== GAME_PHASE.BETTING) return;
    placeBet(value);
    play('chip-place');
    updateButtons();
}

function handleClearBet() {
    if (getState().phase !== GAME_PHASE.BETTING) return;
    clearBet();
    updateButtons();
}

// ── Deal ────────────────────────────────────────────────────────
async function handleDeal() {
    const state = getState();
    if (isProcessing || state.phase !== GAME_PHASE.BETTING) return;
    if (!isValidBet()) return;
    ensureInitialized();
    isProcessing = true;

    if (state.shoe.needsReshuffle) {
        resetCount();
        state.shoe.shuffle();
        play('shuffle');
        showMessage('Shuffling new shoe…');
        await delay(600);
    }

    setState({ phase: GAME_PHASE.DEALING });
    showMessage('Dealing…');
    refreshStrategyMatrix();
    clearCardRows();

    // Assign bet to hand and deduct from bankroll
    const freshState = getState();
    const { shoe, dealerHand, playerHands } = freshState;
    const playerHand = playerHands[0];
    playerHand.bet = freshState.currentBet;
    lastBetAmount = freshState.currentBet;
    setState({ bankroll: freshState.bankroll - freshState.currentBet });

    // Deal 4 cards one at a time: P, D, P, D(face-down)
    const card1 = shoe.draw(); playerHand.addCard(card1); updateCount(card1);
    addCardToPlayer(card1); play('card-deal'); await delay(450);

    const card2 = shoe.draw(); dealerHand.addCard(card2); updateCount(card2);
    addCardToDealer(card2); play('card-deal'); await delay(450);

    const card3 = shoe.draw(); playerHand.addCard(card3); updateCount(card3);
    addCardToPlayer(card3); play('card-deal'); await delay(450);

    const card4 = shoe.draw(false); dealerHand.addCard(card4); // face-down, don't count yet
    addCardToDealer(card4); play('card-deal'); await delay(450);

    setState({ shoe });
    updateShoeInfo();
    refreshScores();
    refreshMatrixHighlight();

    // Insurance check
    const dealerUp = getDealerUpCard(dealerHand);
    if (dealerUp?.rank === 'ace') {
        setState({ phase: GAME_PHASE.INSURANCE });
        showMessage('Dealer shows Ace — Insurance?');
        updateButtons();
        isProcessing = false;
        return;
    }

    await checkBlackjacks();
}

// ── Insurance ───────────────────────────────────────────────────
async function handleInsuranceYes() {
    if (!canInsurance()) return;
    placeInsurance();
    play('chip-place');
    await checkBlackjacks();
}

async function handleInsuranceNo() {
    await checkBlackjacks();
}

async function checkBlackjacks() {
    const state = getState();
    const playerHand = getCurrentHand();
    const { dealerHand } = state;

    const playerBJ = playerHand.isBlackjack;
    // Peek at hole card via getScore() which reads all cards regardless of faceUp state
    const dealerBJ = dealerHand.cards.length === 2 && dealerHand.getScore().total === 21;

    if (playerBJ || dealerBJ) {
        await startDealerTurn();
    } else {
        setState({ phase: GAME_PHASE.PLAYER_TURN });
        showMessage('Agent is thinking…');
        updateButtons();
        isProcessing = false;
        await triggerAgentTurn();
    }
}

// ── Agent turn ──────────────────────────────────────────────────
async function triggerAgentTurn() {
    const state = getState();
    if (state.phase !== GAME_PHASE.PLAYER_TURN && state.phase !== GAME_PHASE.SPLIT_TURN) return;

    const hand = getCurrentHand();
    if (!hand || hand.isBusted || hand.isStanding) {
        await advanceOrDealer();
        return;
    }

    setState({ agentThinking: true });
    showAgentThinking();
    updateButtons();

    let decision;
    try {
        decision = await getAgentDecision(getState());
    } catch (err) {
        console.error('[Agent] Error:', err);
        showAgentError(err.message);
        setState({ agentThinking: false, agentError: err.message });
        updateButtons();
        return;
    }

    setState({ agentThinking: false, lastAgentDecision: decision });
    showAgentDecision(decision, getState().explainLevel);
    refreshMatrixHighlight();
    updateButtons();

    if (getState().agentMode === AGENT_MODE.AUTO) {
        await delay(AGENT_THINK_DELAY_MS);
        await executeDecision(decision.action);
    }
    // STEP mode: wait for user to click Execute (handled by handleExecute)
}

// ── Execute (step mode) ─────────────────────────────────────────
async function handleExecute() {
    if (isProcessing) return;
    const { lastAgentDecision, agentThinking, phase } = getState();
    if (agentThinking) return;
    if (phase !== GAME_PHASE.PLAYER_TURN && phase !== GAME_PHASE.SPLIT_TURN) return;
    if (!lastAgentDecision) return;
    await executeDecision(lastAgentDecision.action);
}

// ── Execute decision ─────────────────────────────────────────────
async function executeDecision(action) {
    isProcessing = true;
    const state = getState();
    const hand = getCurrentHand();

    // Record analytics comparison
    const dealerUp = getDealerUpCard(state.dealerHand);
    const strategyCode = dealerUp ? getHintCode(hand, dealerUp) : null;
    const strategyActionMap = { H: ACTION.HIT, S: ACTION.STAND, D: ACTION.DOUBLE, P: ACTION.SPLIT };
    const strategyAction = strategyCode ? strategyActionMap[strategyCode] : null;

    console.log(`[Agent] Executing: ${action} (basic strategy: ${strategyCode})`);

    switch (action) {
        case ACTION.HIT:
            if (!canHit()) { await executeDecision(ACTION.STAND); return; }
            play('card-deal');
            hit(state.shoe);
            addCardToPlayer(getCurrentHand().cards.at(-1));
            updateCount(getCurrentHand().cards.at(-1));
            setState({ shoe: state.shoe });
            refreshScores();
            await delay(450);
            break;

        case ACTION.STAND:
            if (!canStand()) break;
            stand();
            play('button');
            break;

        case ACTION.DOUBLE: {
            if (!canDoubleDown()) { await executeDecision(ACTION.STAND); return; }
            doubleDown(state.shoe);
            play('card-deal');
            const dCard = getCurrentHand().cards.at(-1);
            addCardToPlayer(dCard);
            updateCount(dCard);
            setState({ shoe: state.shoe });
            refreshScores();
            await delay(450);
            break;
        }

        case ACTION.SPLIT:
            if (!canSplit()) { await executeDecision(ACTION.HIT); return; }
            split(state.shoe);
            setState({ shoe: state.shoe });
            renderPlayerHand(true);
            play('card-deal');
            await delay(400);
            break;

        default:
            stand();
    }

    refreshMatrixHighlight();
    const updatedHand = getCurrentHand();

    if (updatedHand.isBusted) {
        shakePlayerCards();
        play('bust');
        showMessage('Bust!', 'lose');
        await delay(700);
        await advanceOrDealer();
        return;
    }

    if (updatedHand.isStanding || updatedHand.score === 21) {
        await advanceOrDealer();
        return;
    }

    // More actions needed
    setState({ lastAgentDecision: null });
    isProcessing = false;
    await triggerAgentTurn();
}

async function advanceOrDealer() {
    const state = getState();
    const allHandsDone = state.playerHands.every(h => h.isBusted || h.isStanding || h.score === 21);

    if (!allHandsDone && state.playerHands.length > 1) {
        advanceToNextHand();
        setState({ lastAgentDecision: null, phase: GAME_PHASE.SPLIT_TURN });
        isProcessing = false;
        await triggerAgentTurn();
    } else {
        await startDealerTurn();
    }
}

// ── Dealer turn ─────────────────────────────────────────────────
async function startDealerTurn() {
    setState({ phase: GAME_PHASE.DEALER_TURN });
    showAgentIdle();
    updateButtons();
    isProcessing = true;

    flipDealerHoleCard();
    const { dealerHand, shoe } = getState();
    dealerHand.cards[1].faceUp = true;
    updateCount(dealerHand.cards[1]);
    renderDealerHand(false);
    await delay(500);

    await executeDealerTurn(shoe, dealerHand, async (card) => {
        addCardToDealer(card);
        updateCount(card);
        setState({ shoe });
        play('card-deal');
        await delay(400);
    });

    renderDealerHand(false);
    await resolveHands();
}

// ── Resolution ───────────────────────────────────────────────────
async function resolveHands() {
    setState({ phase: GAME_PHASE.RESOLUTION });
    updateButtons();

    const state = getState();
    // resolveRound applies bankroll payout internally via setState
    const result = resolveRound(state.playerHands, state.dealerHand);
    setState({ roundResult: result });

    // Determine primary outcome for display
    const primary = result.results[0];
    const outcome = primary?.outcome;

    let msg = 'Round over';
    let msgType = '';

    if (outcome === OUTCOME.PLAYER_BLACKJACK) { msg = 'Blackjack! 🎉'; msgType = 'bj'; play('blackjack'); pulseWin(); }
    else if (outcome === OUTCOME.PLAYER_WIN || outcome === OUTCOME.DEALER_BUST) { msg = 'You win!'; msgType = 'win'; play('win'); pulseWin(); }
    else if (outcome === OUTCOME.PUSH || outcome === OUTCOME.BOTH_BLACKJACK) { msg = 'Push — bet returned'; msgType = 'push'; play('push'); }
    else if (outcome === OUTCOME.DEALER_BLACKJACK) { msg = 'Dealer Blackjack'; msgType = 'lose'; play('lose'); }
    else { msg = 'Dealer wins'; msgType = 'lose'; play('lose'); }

    showMessage(msg, msgType);

    // Record analytics
    const decision = state.lastAgentDecision;
    const dealerUp = getDealerUpCard(state.dealerHand);
    const strategyCode = dealerUp && state.playerHands[0]?.cards.length >= 2
        ? getHintCode(state.playerHands[0], dealerUp)
        : null;
    const strategyActionMap = { H: ACTION.HIT, S: ACTION.STAND, D: ACTION.DOUBLE, P: ACTION.SPLIT };

    recordDecision({
        agentAction: decision?.action || null,
        strategyAction: strategyCode ? (strategyActionMap[strategyCode] || null) : null,
        outcome,
        bankroll: getState().bankroll,  // read after resolveRound updated it
        bet: state.currentBet
    });
    updateAnalyticsBar();

    renderDealerHand(false);
    isProcessing = false;
    updateButtons();

    // Auto-deal next hand
    if (autoDealEnabled && getState().agentMode === AGENT_MODE.AUTO && getState().apiKey) {
        await delay(AUTO_DEAL_DELAY_MS);
        handleNewRound();
        if (lastBetAmount > 0 && getState().bankroll >= lastBetAmount) {
            placeBet(lastBetAmount);
            await handleDeal();
        }
    }
}

// ── New round ────────────────────────────────────────────────────
function handleNewRound() {
    if (isProcessing) return;
    const state = getState();
    if (state.bankroll < DEFAULTS.MIN_BET) {
        resetGame();
        showMessage('Bankroll reset — start fresh!');
        refreshStrategyMatrix();
        showAgentIdle();
        updateButtons();
        return;
    }
    resetRound();
    clearCardRows();
    refreshStrategyMatrix();
    showAgentIdle();
    showMessage('Place a bet to deal');
    updateButtons();
}

// ── Settings ─────────────────────────────────────────────────────
function handleExplainLevel(level) {
    setState({ explainLevel: level });
    updateExplainDisplay(level);
}

function handleRiskProfile(profile) {
    setState({ riskProfile: profile });
    updateRiskDisplay(profile);
    // Re-query agent in step mode if a decision is active
    const state = getState();
    if (state.agentMode === AGENT_MODE.STEP && !state.agentThinking &&
        (state.phase === GAME_PHASE.PLAYER_TURN || state.phase === GAME_PHASE.SPLIT_TURN)) {
        setState({ lastAgentDecision: null });
        showAgentIdle();
        updateButtons();
        triggerAgentTurn();
    }
}

function handleSetting(key, value) {
    if (key === 'soundEnabled') {
        value ? unmute() : mute();
        localStorage.setItem('bja_sound', value);
    } else if (key === 'countEnabled') {
        setState({ settings: { ...getState().settings, countEnabled: value } });
        localStorage.setItem('bja_count', value);
        updateShoeInfo();
    } else if (key === 'autoDeal') {
        autoDealEnabled = value;
        localStorage.setItem('bja_autodeal', value);
    }
}

function handleResetAnalytics() {
    if (confirm('Reset all analytics data?')) {
        resetAnalytics();
        updateAnalyticsBar();
        hideAnalyticsModal();
    }
}
