// dealer.js — Dealer AI logic (hit/stand rules)

import { DEFAULTS } from './config.js';

export function shouldDealerHit(hand) {
    const { total, isSoft } = hand.getScore();

    if (total < 17) return true;

    // Dealer hits soft 17 if configured
    if (total === 17 && isSoft && DEFAULTS.DEALER_HITS_SOFT_17) return true;

    return false;
}

export async function executeDealerTurn(shoe, dealerHand, onCardDealt) {
    // Flip hole card
    const holeCard = dealerHand.cards[1];
    if (!holeCard.faceUp) {
        holeCard.flip();
        if (onCardDealt) await onCardDealt(holeCard, 'flip');
    }

    // Draw cards per dealer rules
    while (shouldDealerHit(dealerHand)) {
        const card = shoe.draw(true);
        dealerHand.addCard(card);
        if (onCardDealt) await onCardDealt(card, 'draw');
    }

    return dealerHand;
}

export function getDealerUpCard(dealerHand) {
    return dealerHand.cards.find(c => c.faceUp) || dealerHand.cards[0];
}
