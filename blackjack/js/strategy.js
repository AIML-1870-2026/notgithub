// strategy.js — Basic strategy lookup table and hint generation

// Dealer up card index: 2=0, 3=1, ..., 10=8, A=9
function dealerIndex(card) {
    if (card.rank === 'ace') return 9;
    const val = card.value[0];
    return val - 2;
}

// H=Hit, S=Stand, D=Double (hit if can't), P=Split
// Hard totals (rows: 5-17+, cols: dealer 2-A)
const HARD = [
    // 5     6     7     8
    ['H','H','H','H','H','H','H','H','H','H'], // 5
    ['H','H','H','H','H','H','H','H','H','H'], // 6
    ['H','H','H','H','H','H','H','H','H','H'], // 7
    ['H','H','H','H','H','H','H','H','H','H'], // 8
    ['H','D','D','D','D','H','H','H','H','H'], // 9
    ['D','D','D','D','D','D','D','D','H','H'], // 10
    ['D','D','D','D','D','D','D','D','D','D'], // 11
    ['H','H','S','S','S','H','H','H','H','H'], // 12
    ['S','S','S','S','S','H','H','H','H','H'], // 13
    ['S','S','S','S','S','H','H','H','H','H'], // 14
    ['S','S','S','S','S','H','H','H','H','H'], // 15
    ['S','S','S','S','S','H','H','H','H','H'], // 16
    ['S','S','S','S','S','S','S','S','S','S'], // 17+
];

// Soft totals (rows: A+2 through A+9, cols: dealer 2-A)
const SOFT = [
    ['H','H','H','D','D','H','H','H','H','H'], // A,2 (13)
    ['H','H','H','D','D','H','H','H','H','H'], // A,3 (14)
    ['H','H','D','D','D','H','H','H','H','H'], // A,4 (15)
    ['H','H','D','D','D','H','H','H','H','H'], // A,5 (16)
    ['H','D','D','D','D','H','H','H','H','H'], // A,6 (17)
    ['D','D','D','D','D','S','S','H','H','H'], // A,7 (18)
    ['S','S','S','S','D','S','S','S','S','S'], // A,8 (19)
    ['S','S','S','S','S','S','S','S','S','S'], // A,9 (20)
];

// Pair splitting (rows: pair of 2-A, cols: dealer 2-A)
// Y=Split, N=Don't split
const PAIRS = [
    ['P','P','P','P','P','P','H','H','H','H'], // 2,2
    ['P','P','P','P','P','P','H','H','H','H'], // 3,3
    ['H','H','H','P','P','H','H','H','H','H'], // 4,4
    ['D','D','D','D','D','D','D','D','H','H'], // 5,5 (never split)
    ['P','P','P','P','P','H','H','H','H','H'], // 6,6
    ['P','P','P','P','P','P','H','H','H','H'], // 7,7
    ['P','P','P','P','P','P','P','P','P','P'], // 8,8
    ['P','P','P','P','P','S','P','P','S','S'], // 9,9
    ['S','S','S','S','S','S','S','S','S','S'], // 10,10
    ['P','P','P','P','P','P','P','P','P','P'], // A,A
];

function pairIndex(card) {
    if (card.rank === 'ace') return 9;
    const val = card.value[0];
    return val - 2;
}

export function getHint(playerHand, dealerUpCard) {
    if (!dealerUpCard || playerHand.cards.length < 2) return null;

    const di = dealerIndex(dealerUpCard);
    const { total, isSoft } = playerHand.getScore();

    // Check for pair first
    if (playerHand.canSplit) {
        const pi = pairIndex(playerHand.cards[0]);
        const action = PAIRS[pi][di];
        if (action === 'P') return 'Split';
    }

    // Soft hand
    if (isSoft && total >= 13 && total <= 20) {
        const row = total - 13;
        const action = SOFT[row][di];
        return actionToString(action);
    }

    // Hard hand
    if (total <= 4) return 'Hit';
    if (total >= 17) return HARD[12][di] === 'S' ? 'Stand' : actionToString(HARD[12][di]);

    const row = total - 5;
    if (row >= 0 && row < HARD.length) {
        return actionToString(HARD[row][di]);
    }

    return 'Hit';
}

// Returns the raw action code (H/S/D/P) for comparison purposes
// skipPairs: if true, skip pair check and return hard/soft code instead
export function getHintCode(playerHand, dealerUpCard, skipPairs = false) {
    if (!dealerUpCard || playerHand.cards.length < 2) return null;

    const di = dealerIndex(dealerUpCard);
    const { total, isSoft } = playerHand.getScore();

    if (!skipPairs && playerHand.canSplit) {
        const pi = pairIndex(playerHand.cards[0]);
        const action = PAIRS[pi][di];
        if (action === 'P') return 'P';
    }

    if (isSoft && total >= 13 && total <= 20) {
        return SOFT[total - 13][di];
    }

    if (total <= 4) return 'H';
    if (total >= 17) return HARD[12][di];

    const row = total - 5;
    if (row >= 0 && row < HARD.length) return HARD[row][di];

    return 'H';
}

function actionToString(code) {
    switch (code) {
        case 'H': return 'Hit';
        case 'S': return 'Stand';
        case 'D': return 'Double Down';
        case 'P': return 'Split';
        default: return 'Hit';
    }
}
