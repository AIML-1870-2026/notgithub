// main.js — Entry point, round lifecycle orchestrator

import { GAME_PHASE, DEFAULTS } from './config.js';
import { Shoe } from './deck.js';
import { getState, setState, resetRound, getCurrentHand } from './gameState.js';
import { getDealerUpCard, executeDealerTurn } from './dealer.js';
import * as player from './player.js';
import * as betting from './betting.js';
import * as ui from './ui.js';
import * as input from './input.js';
import * as sound from './sound.js';
import * as stats from './stats.js';
import * as cardCount from './cardCount.js';
import * as animations from './animations.js';
import { initTheme } from './themes.js';
import { delay } from './animations.js';
import { getCoachAdvice, getDeviationFeedback, clearLastAdvice } from './coach.js';

let isProcessing = false; // Prevents actions during animations
let currentCoachCode = null; // Stores the recommended action code for deviation tracking

// --- Initialize ---

function init() {
    // Init theme
    initTheme();

    // Init UI
    ui.initUI();

    // Create shoe
    const shoe = new Shoe(DEFAULTS.NUM_DECKS);
    setState({ shoe });

    // Load saved settings
    loadSettings();

    // Set up input callbacks
    input.setCallbacks({
        onHit: handleHit,
        onStand: handleStand,
        onDouble: handleDouble,
        onSplit: handleSplit,
        onDeal: handleDeal,
        onNewRound: handleNewRound,
        onChipClick: handleChipClick,
        onClearBet: handleClearBet,
        onInsuranceYes: handleInsuranceYes,
        onInsuranceNo: handleInsuranceNo,
        onCoachToggle: handleCoachToggle
    });

    input.initInput();

    // First-time coach prompt
    initCoachPrompt();

    // Initial render
    ui.showMessage('Place your bet to begin');
    ui.refreshUI();

    // Init sound on first interaction
    document.addEventListener('click', () => sound.ensureInitialized(), { once: true });
}

function loadSettings() {
    try {
        const soundMuted = localStorage.getItem('blackjack_muted') === 'true';
        const coach = localStorage.getItem('blackjack_coach') === 'true';
        const count = localStorage.getItem('blackjack_count') === 'true';

        setState({
            settings: {
                soundEnabled: !soundMuted,
                coachEnabled: coach,
                countEnabled: count,
                theme: 'dark'
            }
        });

        // Sync settings UI
        document.getElementById('setting-sound').checked = !soundMuted;
        document.getElementById('setting-coach').checked = coach;
        document.getElementById('setting-count').checked = count;

        if (soundMuted) sound.mute();
    } catch (e) {
        // Ignore
    }
}

// --- Coach First-Time Prompt ---

function initCoachPrompt() {
    const prompted = localStorage.getItem('blackjack_coach_prompted');
    if (prompted) return;

    const modal = document.getElementById('coach-prompt-modal');
    const btnYes = document.getElementById('btn-coach-yes');
    const btnNo = document.getElementById('btn-coach-no');

    modal.classList.remove('hidden');

    btnYes.addEventListener('click', () => {
        setState({
            settings: { ...getState().settings, coachEnabled: true }
        });
        document.getElementById('setting-coach').checked = true;
        localStorage.setItem('blackjack_coach', 'true');
        localStorage.setItem('blackjack_coach_prompted', 'true');
        modal.classList.add('hidden');
        ui.updateCoachButton();
    });

    btnNo.addEventListener('click', () => {
        localStorage.setItem('blackjack_coach_prompted', 'true');
        modal.classList.add('hidden');
    });
}

// --- Coach Helper ---

function showCoachForCurrentHand() {
    const state = getState();
    if (!state.settings.coachEnabled) {
        ui.hideCoach();
        currentCoachCode = null;
        return;
    }

    const hand = getCurrentHand();
    const dealerUpCard = getDealerUpCard(state.dealerHand);

    if (hand && dealerUpCard && hand.cards.length >= 2) {
        const advice = getCoachAdvice(
            hand, dealerUpCard,
            player.canSplit(), player.canDoubleDown()
        );
        if (advice) {
            currentCoachCode = advice.code;
            ui.showCoachAdvice(advice);
            return;
        }
    }

    ui.hideCoach();
    currentCoachCode = null;
}

function checkDeviation(actionName) {
    const state = getState();
    if (!state.settings.coachEnabled || !currentCoachCode) return;

    const hand = getCurrentHand();
    const dealerUpCard = getDealerUpCard(state.dealerHand);

    const feedback = getDeviationFeedback(
        currentCoachCode, actionName, hand, dealerUpCard
    );
    if (feedback) {
        ui.showCoachFeedback(feedback);
    }
}

function handleCoachToggle(enabled) {
    const { phase } = getState();
    const isPlayerTurn = phase === GAME_PHASE.PLAYER_TURN || phase === GAME_PHASE.SPLIT_TURN;

    if (enabled && isPlayerTurn) {
        showCoachForCurrentHand();
    } else if (!enabled) {
        ui.hideCoach();
        currentCoachCode = null;
    }
}

// --- Betting Phase ---

function handleChipClick(value) {
    if (isProcessing) return;
    const { phase } = getState();
    if (phase !== GAME_PHASE.BETTING) return;

    betting.placeBet(value);
    ui.updateBetDisplay();
    ui.updateButtons();
}

function handleClearBet() {
    if (isProcessing) return;
    const { phase } = getState();
    if (phase !== GAME_PHASE.BETTING) return;

    betting.clearBet();
    ui.updateBetDisplay();
    ui.updateButtons();
}

// --- Deal Phase ---

async function handleDeal() {
    if (isProcessing) return;
    const { phase, currentBet, bankroll } = getState();
    if (phase !== GAME_PHASE.BETTING) return;
    if (!betting.isValidBet()) return;

    isProcessing = true;
    clearLastAdvice();
    currentCoachCode = null;
    ui.hideCoach();

    // Deduct bet from bankroll
    setState({ bankroll: bankroll - currentBet });

    // Set bet on player hand
    const hand = getCurrentHand();
    hand.bet = currentBet;

    // Check if shoe needs reshuffle
    const { shoe } = getState();
    if (shoe.needsReshuffle) {
        shoe.buildAndShuffle();
        cardCount.resetCount();
        sound.play('shuffle');
        ui.showMessage('Shuffling...');
        await delay(800);
    }

    setState({ phase: GAME_PHASE.DEALING });
    ui.showMessage('Dealing...');
    ui.updateBetDisplay();
    ui.updateButtons();

    // Deal cards: player, dealer, player, dealer(hole)
    const card1 = shoe.draw(true);
    hand.addCard(card1);
    cardCount.updateCount(card1);
    await ui.addCardToPlayerHand(card1);
    sound.play('card-deal');
    await delay(300);

    const dCard1 = shoe.draw(true);
    getState().dealerHand.addCard(dCard1);
    cardCount.updateCount(dCard1);
    await ui.addCardToDealerHand(dCard1);
    sound.play('card-deal');
    await delay(300);

    const card2 = shoe.draw(true);
    hand.addCard(card2);
    cardCount.updateCount(card2);
    await ui.addCardToPlayerHand(card2);
    sound.play('card-deal');
    await delay(300);

    const dCard2 = shoe.draw(false); // Face down hole card
    getState().dealerHand.addCard(dCard2);
    // Don't count hole card yet — count when flipped
    await ui.addCardToDealerHand(dCard2);
    sound.play('card-deal');
    await delay(300);

    ui.updateShoeInfo();

    // Check for insurance opportunity
    if (dCard1.rank === 'ace') {
        setState({ phase: GAME_PHASE.INSURANCE });
        ui.showMessage('Dealer shows Ace — Insurance?');
        ui.updateButtons();
        isProcessing = false;
        return;
    }

    // Check for player blackjack
    await checkBlackjacks();
}

async function checkBlackjacks() {
    const state = getState();
    const hand = getCurrentHand();
    const dealerHand = state.dealerHand;

    // Peek: check if dealer has blackjack (when showing 10-value)
    const dealerUpCard = getDealerUpCard(dealerHand);

    if (hand.isBlackjack) {
        // Check dealer too
        if (dealerHand.cards[1]) {
            dealerHand.cards[1].flip(); // Reveal hole card
            cardCount.updateCount(dealerHand.cards[1]);
            await ui.flipDealerHoleCard(dealerHand.cards[1]);
        }

        if (dealerHand.isBlackjack) {
            // Both blackjack — push
            await resolveRound();
        } else {
            // Player blackjack wins
            await resolveRound();
        }
        return;
    }

    // If dealer shows 10-value, peek for blackjack
    if (dealerUpCard.isTenValue) {
        if (dealerHand.cards[1]) {
            // Temporarily check
            const holeCard = dealerHand.cards[1];
            const tempFaceUp = holeCard.faceUp;
            holeCard.faceUp = true;
            const dealerBJ = dealerHand.isBlackjack;
            holeCard.faceUp = tempFaceUp;

            if (dealerBJ) {
                holeCard.flip();
                cardCount.updateCount(holeCard);
                await ui.flipDealerHoleCard(holeCard);
                await resolveRound();
                return;
            }
        }
    }

    // Normal player turn
    setState({ phase: GAME_PHASE.PLAYER_TURN });
    ui.showMessage('Your turn');
    ui.updateButtons();
    showCoachForCurrentHand();
    isProcessing = false;
}

// --- Insurance ---

async function handleInsuranceYes() {
    if (isProcessing) return;
    if (!player.canInsurance()) return;

    isProcessing = true;
    player.placeInsurance();
    ui.updateBetDisplay();

    // Now check for blackjacks
    await checkBlackjacks();
}

async function handleInsuranceNo() {
    if (isProcessing) return;
    const { phase } = getState();
    if (phase !== GAME_PHASE.INSURANCE) return;

    isProcessing = true;
    await checkBlackjacks();
}

// --- Player Actions ---

async function handleHit() {
    if (isProcessing) return;
    if (!player.canHit()) return;

    // Check deviation before acting
    checkDeviation('hit');

    isProcessing = true;

    const { shoe } = getState();
    const card = player.hit(shoe);
    if (!card) { isProcessing = false; return; }

    cardCount.updateCount(card);
    await ui.addCardToPlayerHand(card);
    sound.play('card-deal');
    ui.updateCount();
    ui.updateShoeInfo();

    const hand = getCurrentHand();

    if (hand.isBusted) {
        sound.play('bust');
        ui.showMessage('Bust!', 'lose');
        ui.hideCoach();
        animations.shakeAnimation(document.getElementById('player-cards'));

        // Check if there are more split hands
        if (!advanceToNextSplitHand()) {
            await delay(500);
            await startDealerTurn();
        } else {
            isProcessing = false;
        }
        return;
    }

    if (hand.score === 21) {
        // Auto-stand on 21
        hand.isStanding = true;
        ui.showMessage('21!');
        ui.hideCoach();

        if (!advanceToNextSplitHand()) {
            await delay(500);
            await startDealerTurn();
        } else {
            isProcessing = false;
        }
        return;
    }

    ui.updateButtons();
    // Show new coach advice for updated hand
    showCoachForCurrentHand();
    isProcessing = false;
}

async function handleStand() {
    if (isProcessing) return;
    if (!player.canStand()) return;

    // Check deviation before acting
    checkDeviation('stand');

    isProcessing = true;
    player.stand();
    ui.hideCoach();

    if (!advanceToNextSplitHand()) {
        await startDealerTurn();
    } else {
        isProcessing = false;
    }
}

async function handleDouble() {
    if (isProcessing) return;
    if (!player.canDoubleDown()) return;

    // Check deviation before acting
    checkDeviation('double down');

    isProcessing = true;

    const { shoe } = getState();
    const card = player.doubleDown(shoe);
    if (!card) { isProcessing = false; return; }

    cardCount.updateCount(card);
    await ui.addCardToPlayerHand(card);
    sound.play('card-deal');
    ui.updateBetDisplay();
    ui.updateCount();
    ui.updateShoeInfo();
    ui.hideCoach();

    const hand = getCurrentHand();

    if (hand.isBusted) {
        sound.play('bust');
        ui.showMessage('Bust on Double!', 'lose');
        animations.shakeAnimation(document.getElementById('player-cards'));
    }

    if (!advanceToNextSplitHand()) {
        await delay(500);
        await startDealerTurn();
    } else {
        isProcessing = false;
    }
}

async function handleSplit() {
    if (isProcessing) return;
    if (!player.canSplit()) return;

    // Check deviation before acting
    checkDeviation('split');

    isProcessing = true;

    const { shoe } = getState();
    const result = player.split(shoe);
    if (!result) { isProcessing = false; return; }

    // Count new cards
    cardCount.updateCount(result.newCard1);
    cardCount.updateCount(result.newCard2);

    sound.play('card-deal');
    ui.updateBetDisplay();
    ui.updateCount();
    ui.updateShoeInfo();

    // Re-render for current split hand
    await ui.renderPlayerHand(true);
    ui.showMessage('Hand 1');
    ui.updateButtons();
    showCoachForCurrentHand();

    isProcessing = false;
}

function advanceToNextSplitHand() {
    const hasNext = player.advanceToNextHand();
    if (hasNext) {
        ui.renderPlayerHand(false);
        const state = getState();
        ui.showMessage(`Hand ${state.currentHandIndex + 1}`);
        ui.updateButtons();
        showCoachForCurrentHand();
        return true;
    }
    return false;
}

// --- Dealer Turn ---

async function startDealerTurn() {
    const state = getState();
    setState({ phase: GAME_PHASE.DEALER_TURN });
    ui.showMessage('Dealer\'s turn');
    ui.updateButtons();
    ui.hideCoach();

    const { shoe, dealerHand } = getState();

    // Check if all player hands busted
    const allBusted = state.playerHands.every(h => h.isBusted);

    if (!allBusted) {
        await executeDealerTurn(shoe, dealerHand, async (card, type) => {
            if (type === 'flip') {
                cardCount.updateCount(card);
                await ui.flipDealerHoleCard(card);
                sound.play('card-flip');
            } else {
                cardCount.updateCount(card);
                await ui.addCardToDealerHand(card);
                sound.play('card-deal');
            }
            ui.updateCount();
            ui.updateShoeInfo();
            await delay(500);
        });
    } else {
        // Just flip the hole card for show
        const holeCard = dealerHand.cards[1];
        if (holeCard && !holeCard.faceUp) {
            holeCard.flip();
            cardCount.updateCount(holeCard);
            await ui.flipDealerHoleCard(holeCard);
            sound.play('card-flip');
        }
    }

    await delay(300);
    await resolveRound();
}

// --- Resolution ---

async function resolveRound() {
    const state = getState();
    setState({ phase: GAME_PHASE.RESOLUTION });

    const { results, totalPayout } = betting.resolveRound(
        state.playerHands,
        state.dealerHand
    );

    // Record stats for each hand
    for (const result of results) {
        if (result.outcome === 'insurance_win' || result.outcome === 'insurance_loss') continue;
        stats.recordResult(result.outcome, result.bet, result.payout);
    }

    // Show primary outcome message
    const primaryResult = results[0];
    if (primaryResult) {
        const msg = betting.getOutcomeMessage(primaryResult.outcome);
        const type = getMessageType(primaryResult.outcome);

        ui.showMessage(msg, type);
        ui.showOutcomeEffects(primaryResult.outcome);

        // Play appropriate sound
        switch (primaryResult.outcome) {
            case 'player_blackjack':
                sound.play('blackjack');
                break;
            case 'player_win':
            case 'dealer_bust':
                sound.play('win');
                break;
            case 'player_bust':
            case 'dealer_win':
            case 'dealer_blackjack':
                sound.play('lose');
                break;
            case 'both_blackjack':
            case 'push':
                sound.play('push');
                break;
        }
    }

    ui.updateBetDisplay();
    ui.updateButtons();
    ui.updateCount();

    // Save settings
    saveSettings();

    isProcessing = false;
}

function getMessageType(outcome) {
    switch (outcome) {
        case 'player_blackjack':
        case 'player_win':
        case 'dealer_bust':
            return 'win';
        case 'player_bust':
        case 'dealer_win':
        case 'dealer_blackjack':
            return 'lose';
        case 'both_blackjack':
        case 'push':
            return 'push';
        default:
            return '';
    }
}

// --- New Round ---

function handleNewRound() {
    if (isProcessing) return;
    const { phase } = getState();
    if (phase !== GAME_PHASE.RESOLUTION) return;

    ui.clearTable();
    resetRound();
    clearLastAdvice();
    currentCoachCode = null;
    ui.showMessage('Place your bet');
    ui.refreshUI();
}

// --- Settings Persistence ---

function saveSettings() {
    try {
        const { settings } = getState();
        localStorage.setItem('blackjack_coach', settings.coachEnabled);
        localStorage.setItem('blackjack_count', settings.countEnabled);
    } catch (e) {
        // Ignore
    }
}

// --- Start ---

document.addEventListener('DOMContentLoaded', init);
