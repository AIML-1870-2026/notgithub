// deck.js — Card model and Shoe (multi-deck) class

import { SUITS, RANKS, DEFAULTS } from './config.js';

export class Card {
    constructor(rank, suit, faceUp = true) {
        this.rank = rank;
        this.suit = suit;
        this.faceUp = faceUp;
    }

    get imagePath() {
        return `${DEFAULTS.CARD_ASSET_PATH}/${this.rank}_of_${this.suit}.svg`;
    }

    get value() {
        if (this.rank === 'ace') return [1, 11];
        if (['jack', 'queen', 'king'].includes(this.rank)) return [10];
        return [parseInt(this.rank)];
    }

    get isAce() {
        return this.rank === 'ace';
    }

    get isTenValue() {
        return this.value[0] === 10;
    }

    flip() {
        this.faceUp = !this.faceUp;
    }

    toString() {
        return `${this.rank} of ${this.suit}`;
    }
}

export class Shoe {
    constructor(numDecks = DEFAULTS.NUM_DECKS) {
        this.numDecks = numDecks;
        this.cards = [];
        this.currentIndex = 0;
        this.buildAndShuffle();
    }

    buildAndShuffle() {
        this.cards = [];
        for (let d = 0; d < this.numDecks; d++) {
            for (const suit of SUITS) {
                for (const rank of RANKS) {
                    this.cards.push(new Card(rank, suit));
                }
            }
        }
        this.shuffle();
    }

    shuffle() {
        this.currentIndex = 0;
        // Fisher-Yates shuffle
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    draw(faceUp = true) {
        if (this.currentIndex >= this.cards.length) {
            this.buildAndShuffle();
        }
        const card = this.cards[this.currentIndex++];
        card.faceUp = faceUp;
        return card;
    }

    get cardsRemaining() {
        return this.cards.length - this.currentIndex;
    }

    get totalCards() {
        return this.cards.length;
    }

    get needsReshuffle() {
        return this.currentIndex / this.cards.length >= DEFAULTS.RESHUFFLE_THRESHOLD;
    }
}
