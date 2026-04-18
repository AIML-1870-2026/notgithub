// cardCount.js — Hi-Lo card counting system

let runningCount = 0;

export function updateCount(card) {
    const rank = card.rank;
    if (['2', '3', '4', '5', '6'].includes(rank)) {
        runningCount += 1;
    } else if (['10', 'jack', 'queen', 'king', 'ace'].includes(rank)) {
        runningCount -= 1;
    }
    // 7, 8, 9 = 0 (no change)
}

export function getRunningCount() {
    return runningCount;
}

export function getTrueCount(cardsRemaining) {
    const decksRemaining = cardsRemaining / 52;
    if (decksRemaining <= 0) return 0;
    return Math.round(runningCount / decksRemaining);
}

export function resetCount() {
    runningCount = 0;
}
