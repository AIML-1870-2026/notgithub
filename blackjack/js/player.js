// player.js — Player action logic (hit, stand, double, split, insurance)

import { GAME_PHASE } from './config.js';
import { getState, setState, getCurrentHand } from './gameState.js';
import { Hand } from './hand.js';

export function canHit() {
    const { phase } = getState();
    if (phase !== GAME_PHASE.PLAYER_TURN && phase !== GAME_PHASE.SPLIT_TURN) return false;
    const hand = getCurrentHand();
    return !hand.isStanding && !hand.isBusted;
}

export function canStand() {
    const { phase } = getState();
    if (phase !== GAME_PHASE.PLAYER_TURN && phase !== GAME_PHASE.SPLIT_TURN) return false;
    const hand = getCurrentHand();
    return !hand.isStanding;
}

export function canDoubleDown() {
    const { phase, bankroll } = getState();
    if (phase !== GAME_PHASE.PLAYER_TURN && phase !== GAME_PHASE.SPLIT_TURN) return false;
    const hand = getCurrentHand();
    return hand.canDoubleDown && bankroll >= hand.bet;
}

export function canSplit() {
    const { phase, playerHands, bankroll } = getState();
    if (phase !== GAME_PHASE.PLAYER_TURN && phase !== GAME_PHASE.SPLIT_TURN) return false;
    if (playerHands.length >= 4) return false; // Max 4 split hands
    const hand = getCurrentHand();
    return hand.canSplit && bankroll >= hand.bet;
}

export function canInsurance() {
    const { phase, dealerHand, bankroll, currentBet, insuranceBet } = getState();
    if (phase !== GAME_PHASE.INSURANCE) return false;
    if (insuranceBet > 0) return false; // Already placed
    const upCard = dealerHand.cards[0];
    return upCard && upCard.rank === 'ace' && bankroll >= Math.floor(currentBet / 2);
}

export function hit(shoe) {
    if (!canHit()) return null;
    const hand = getCurrentHand();
    const card = shoe.draw(true);
    hand.addCard(card);
    return card;
}

export function stand() {
    if (!canStand()) return false;
    const hand = getCurrentHand();
    hand.isStanding = true;
    return true;
}

export function doubleDown(shoe) {
    if (!canDoubleDown()) return null;
    const state = getState();
    const hand = getCurrentHand();

    // Double the bet
    setState({ bankroll: state.bankroll - hand.bet });
    hand.bet *= 2;
    hand.isDoubled = true;

    // Draw exactly one card
    const card = shoe.draw(true);
    hand.addCard(card);

    // Auto-stand
    hand.isStanding = true;
    return card;
}

export function split(shoe) {
    if (!canSplit()) return null;
    const state = getState();
    const hand = getCurrentHand();

    // Create two new hands from the split
    const card1 = hand.cards[0];
    const card2 = hand.cards[1];

    const hand1 = new Hand([card1]);
    hand1.bet = hand.bet;
    hand1.isFromSplit = true;

    const hand2 = new Hand([card2]);
    hand2.bet = hand.bet;
    hand2.isFromSplit = true;

    // Deduct bet for second hand
    const newBankroll = state.bankroll - hand.bet;

    // Deal one card to each split hand
    const newCard1 = shoe.draw(true);
    hand1.addCard(newCard1);

    const newCard2 = shoe.draw(true);
    hand2.addCard(newCard2);

    // Replace current hand with the two split hands
    const newHands = [...state.playerHands];
    newHands.splice(state.currentHandIndex, 1, hand1, hand2);

    setState({
        playerHands: newHands,
        bankroll: newBankroll,
        phase: GAME_PHASE.SPLIT_TURN
    });

    return { hand1, hand2, newCard1, newCard2 };
}

export function placeInsurance() {
    if (!canInsurance()) return false;
    const state = getState();
    const insuranceAmount = Math.floor(state.currentBet / 2);

    setState({
        insuranceBet: insuranceAmount,
        bankroll: state.bankroll - insuranceAmount
    });

    return true;
}

export function declineInsurance() {
    const { phase } = getState();
    if (phase !== GAME_PHASE.INSURANCE) return false;
    return true;
}

export function advanceToNextHand() {
    const state = getState();
    const nextIndex = state.currentHandIndex + 1;

    if (nextIndex < state.playerHands.length) {
        setState({ currentHandIndex: nextIndex });
        return true;
    }
    return false; // No more hands — proceed to dealer turn
}
