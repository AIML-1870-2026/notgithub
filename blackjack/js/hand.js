// hand.js — Hand class with scoring, blackjack detection, split/double eligibility

export class Hand {
    constructor(cards = []) {
        this.cards = [...cards];
        this.bet = 0;
        this.isStanding = false;
        this.isDoubled = false;
        this.isFromSplit = false;
    }

    addCard(card) {
        this.cards.push(card);
    }

    getScore() {
        let total = 0;
        let aces = 0;

        for (const card of this.cards) {
            if (card.rank === 'ace') {
                aces++;
                total += 11;
            } else {
                total += card.value[0];
            }
        }

        // Demote aces from 11 to 1 as needed
        while (total > 21 && aces > 0) {
            total -= 10;
            aces--;
        }

        return {
            total,
            isSoft: aces > 0 && total <= 21
        };
    }

    get score() {
        return this.getScore().total;
    }

    get isSoft() {
        return this.getScore().isSoft;
    }

    get isBusted() {
        return this.score > 21;
    }

    get isBlackjack() {
        return this.cards.length === 2 && this.score === 21 && !this.isFromSplit;
    }

    get canSplit() {
        if (this.cards.length !== 2) return false;
        return this.cards[0].value[0] === this.cards[1].value[0];
    }

    get canDoubleDown() {
        return this.cards.length === 2 && !this.isDoubled;
    }

    get faceUpCards() {
        return this.cards.filter(c => c.faceUp);
    }

    get visibleScore() {
        let total = 0;
        let aces = 0;

        for (const card of this.faceUpCards) {
            if (card.rank === 'ace') {
                aces++;
                total += 11;
            } else {
                total += card.value[0];
            }
        }

        while (total > 21 && aces > 0) {
            total -= 10;
            aces--;
        }

        return total;
    }

    clear() {
        this.cards = [];
        this.bet = 0;
        this.isStanding = false;
        this.isDoubled = false;
        this.isFromSplit = false;
    }

    toString() {
        const { total, isSoft } = this.getScore();
        const softStr = isSoft ? ' (soft)' : '';
        return `[${this.cards.map(c => c.toString()).join(', ')}] = ${total}${softStr}`;
    }
}
