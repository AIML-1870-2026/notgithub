// betting.js — Bet placement, payout calculation, betting history

import { DEFAULTS, OUTCOME } from './config.js';
import { getState, setState } from './gameState.js';

let bettingHistory = [];

export function placeBet(amount) {
    const { bankroll, currentBet } = getState();
    const newBet = currentBet + amount;

    if (amount < 0) return false;
    if (newBet > bankroll) return false;
    if (newBet > DEFAULTS.MAX_BET) return false;

    setState({ currentBet: newBet });
    return true;
}

export function clearBet() {
    setState({ currentBet: 0 });
}

export function adjustBet(delta) {
    const { currentBet, bankroll } = getState();
    const newBet = currentBet + delta;

    if (newBet < 0) return false;
    if (newBet > bankroll) return false;
    if (newBet > DEFAULTS.MAX_BET) return false;

    setState({ currentBet: Math.max(0, newBet) });
    return true;
}

export function canPlaceBet() {
    const { bankroll } = getState();
    return bankroll >= DEFAULTS.MIN_BET;
}

export function isValidBet() {
    const { currentBet } = getState();
    return currentBet >= DEFAULTS.MIN_BET && currentBet <= DEFAULTS.MAX_BET;
}

export function determineOutcome(playerHand, dealerHand) {
    const playerBJ = playerHand.isBlackjack;
    const dealerBJ = dealerHand.isBlackjack;

    if (playerBJ && dealerBJ) return OUTCOME.BOTH_BLACKJACK;
    if (playerBJ) return OUTCOME.PLAYER_BLACKJACK;
    if (dealerBJ) return OUTCOME.DEALER_BLACKJACK;

    if (playerHand.isBusted) return OUTCOME.PLAYER_BUST;
    if (dealerHand.isBusted) return OUTCOME.DEALER_BUST;

    const playerScore = playerHand.score;
    const dealerScore = dealerHand.score;

    if (playerScore > dealerScore) return OUTCOME.PLAYER_WIN;
    if (dealerScore > playerScore) return OUTCOME.DEALER_WIN;
    return OUTCOME.PUSH;
}

export function calculatePayout(outcome, bet) {
    switch (outcome) {
        case OUTCOME.PLAYER_BLACKJACK:
            return bet + Math.floor(bet * DEFAULTS.BLACKJACK_PAYOUT);
        case OUTCOME.BOTH_BLACKJACK:
        case OUTCOME.PUSH:
            return bet; // Bet returned
        case OUTCOME.PLAYER_WIN:
        case OUTCOME.DEALER_BUST:
            return bet * 2; // Original bet + winnings
        case OUTCOME.PLAYER_BUST:
        case OUTCOME.DEALER_WIN:
        case OUTCOME.DEALER_BLACKJACK:
            return 0; // Lose bet
        default:
            return 0;
    }
}

export function resolveInsurance(dealerHasBlackjack, insuranceBet) {
    if (dealerHasBlackjack) {
        return insuranceBet * (DEFAULTS.INSURANCE_PAYOUT + 1); // Return bet + 2:1 payout
    }
    return 0; // Insurance lost
}

export function resolveRound(playerHands, dealerHand) {
    const state = getState();
    let totalPayout = 0;
    const results = [];

    for (const hand of playerHands) {
        const outcome = determineOutcome(hand, dealerHand);
        const payout = calculatePayout(outcome, hand.bet);
        totalPayout += payout;
        results.push({ outcome, bet: hand.bet, payout });
    }

    // Resolve insurance
    if (state.insuranceBet > 0) {
        const insurancePayout = resolveInsurance(dealerHand.isBlackjack, state.insuranceBet);
        totalPayout += insurancePayout;
        results.push({
            outcome: dealerHand.isBlackjack ? 'insurance_win' : 'insurance_loss',
            bet: state.insuranceBet,
            payout: insurancePayout
        });
    }

    // Record in history
    const historyEntry = {
        timestamp: Date.now(),
        results,
        totalBet: playerHands.reduce((sum, h) => sum + h.bet, 0) + state.insuranceBet,
        totalPayout,
        bankrollAfter: state.bankroll + totalPayout
    };
    bettingHistory.push(historyEntry);
    if (bettingHistory.length > 50) bettingHistory.shift();

    // Update bankroll
    setState({ bankroll: state.bankroll + totalPayout });

    return { results, totalPayout, historyEntry };
}

export function getBettingHistory() {
    return [...bettingHistory];
}

export function getOutcomeMessage(outcome) {
    switch (outcome) {
        case OUTCOME.PLAYER_BLACKJACK: return 'Blackjack!';
        case OUTCOME.BOTH_BLACKJACK: return 'Both Blackjack — Push';
        case OUTCOME.PLAYER_WIN: return 'You Win!';
        case OUTCOME.DEALER_WIN: return 'Dealer Wins';
        case OUTCOME.PUSH: return 'Push';
        case OUTCOME.PLAYER_BUST: return 'Bust!';
        case OUTCOME.DEALER_BUST: return 'Dealer Busts — You Win!';
        case OUTCOME.DEALER_BLACKJACK: return 'Dealer Blackjack';
        default: return '';
    }
}
