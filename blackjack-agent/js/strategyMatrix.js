// strategyMatrix.js — Basic strategy grid visualization (Stretch Challenge #1)

// Dealer columns: 2-9, 10, A
const DEALER_COLS = ['2','3','4','5','6','7','8','9','10','A'];

// H=Hit, S=Stand, D=Double, P=Split
const HARD = [
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

const SOFT = [
    ['H','H','H','D','D','H','H','H','H','H'], // A+2 (13)
    ['H','H','H','D','D','H','H','H','H','H'], // A+3 (14)
    ['H','H','D','D','D','H','H','H','H','H'], // A+4 (15)
    ['H','H','D','D','D','H','H','H','H','H'], // A+5 (16)
    ['H','D','D','D','D','H','H','H','H','H'], // A+6 (17)
    ['D','D','D','D','D','S','S','H','H','H'], // A+7 (18)
    ['S','S','S','S','D','S','S','S','S','S'], // A+8 (19)
    ['S','S','S','S','S','S','S','S','S','S'], // A+9 (20)
];

const PAIRS = [
    ['P','P','P','P','P','P','H','H','H','H'], // 2,2
    ['P','P','P','P','P','P','H','H','H','H'], // 3,3
    ['H','H','H','P','P','H','H','H','H','H'], // 4,4
    ['D','D','D','D','D','D','D','D','H','H'], // 5,5
    ['P','P','P','P','P','H','H','H','H','H'], // 6,6
    ['P','P','P','P','P','P','H','H','H','H'], // 7,7
    ['P','P','P','P','P','P','P','P','P','P'], // 8,8
    ['P','P','P','P','P','S','P','P','S','S'], // 9,9
    ['S','S','S','S','S','S','S','S','S','S'], // 10,10
    ['P','P','P','P','P','P','P','P','P','P'], // A,A
];

const ACTION_LABEL = { H: 'Hit', S: 'Stand', D: 'Double', P: 'Split' };
const ACTION_CLASS = { H: 'hit', S: 'stand', D: 'double', P: 'split' };

function makeSectionTable(title, rowLabels, data, activeRow, activeCol) {
    const table = document.createElement('table');
    table.className = 'matrix-table';

    // Header row
    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    const thTitle = document.createElement('th');
    thTitle.textContent = title;
    thTitle.className = 'matrix-section-title';
    headerRow.appendChild(thTitle);

    DEALER_COLS.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col;
        headerRow.appendChild(th);
    });

    const tbody = table.createTBody();
    data.forEach((row, ri) => {
        const tr = tbody.insertRow();
        const tdLabel = document.createElement('td');
        tdLabel.textContent = rowLabels[ri];
        tdLabel.className = 'matrix-row-label';
        tr.appendChild(tdLabel);

        row.forEach((cell, ci) => {
            const td = document.createElement('td');
            td.textContent = cell;
            td.className = `matrix-cell action-${ACTION_CLASS[cell]}`;

            if (ri === activeRow && ci === activeCol) {
                td.classList.add('matrix-active');
            }
            tr.appendChild(td);
        });
    });

    return table;
}

function dealerColIndex(upCard) {
    if (!upCard) return -1;
    if (upCard.rank === 'ace') return 9;
    const val = upCard.value[0];
    if (val === 10) return 8;
    return val - 2;
}

function getActiveCell(playerHand, dealerUpCard) {
    if (!playerHand || !dealerUpCard || playerHand.cards.length < 2) {
        return { section: null, row: -1, col: -1 };
    }

    const col = dealerColIndex(dealerUpCard);
    const { total, isSoft } = playerHand.getScore();

    if (playerHand.canSplit) {
        const rank = playerHand.cards[0].rank;
        const pairMap = { '2':0,'3':1,'4':2,'5':3,'6':4,'7':5,'8':6,'9':7,'10':8,'jack':8,'queen':8,'king':8,'ace':9 };
        return { section: 'pairs', row: pairMap[rank] ?? -1, col };
    }

    if (isSoft && total >= 13 && total <= 20) {
        return { section: 'soft', row: total - 13, col };
    }

    if (total <= 4) return { section: 'hard', row: 0, col };
    if (total >= 17) return { section: 'hard', row: 12, col };
    return { section: 'hard', row: total - 5, col };
}

/**
 * Render the full strategy matrix into a container element.
 * @param {HTMLElement} container
 * @param {Hand|null} playerHand
 * @param {Card|null} dealerUpCard
 */
export function renderStrategyMatrix(container, playerHand = null, dealerUpCard = null) {
    container.innerHTML = '';

    const { section, row, col } = getActiveCell(playerHand, dealerUpCard);

    const hardLabels = ['5','6','7','8','9','10','11','12','13','14','15','16','17+'];
    const softLabels = ['A+2','A+3','A+4','A+5','A+6','A+7','A+8','A+9'];
    const pairLabels = ['2,2','3,3','4,4','5,5','6,6','7,7','8,8','9,9','10,10','A,A'];

    container.appendChild(makeSectionTable('Hard', hardLabels, HARD,
        section === 'hard' ? row : -1, section === 'hard' ? col : -1));
    container.appendChild(makeSectionTable('Soft', softLabels, SOFT,
        section === 'soft' ? row : -1, section === 'soft' ? col : -1));
    container.appendChild(makeSectionTable('Pairs', pairLabels, PAIRS,
        section === 'pairs' ? row : -1, section === 'pairs' ? col : -1));

    // Legend
    const legend = document.createElement('div');
    legend.className = 'matrix-legend';
    legend.innerHTML = Object.entries(ACTION_LABEL).map(([code, label]) =>
        `<span class="legend-item action-${ACTION_CLASS[code]}">${code} = ${label}</span>`
    ).join('');
    container.appendChild(legend);
}

export function updateHighlight(container, playerHand, dealerUpCard) {
    // Remove existing active highlights
    container.querySelectorAll('.matrix-active').forEach(el => el.classList.remove('matrix-active'));

    if (!playerHand || !dealerUpCard) return;
    const { section, row, col } = getActiveCell(playerHand, dealerUpCard);
    if (row < 0 || col < 0 || !section) return;

    const tables = container.querySelectorAll('.matrix-table');
    const sectionMap = { hard: 0, soft: 1, pairs: 2 };
    const tableIndex = sectionMap[section];
    if (tableIndex === undefined) return;

    const table = tables[tableIndex];
    if (!table) return;

    const bodyRows = table.querySelectorAll('tbody tr');
    const targetRow = bodyRows[row];
    if (!targetRow) return;

    // +1 because first cell is row label
    const targetCell = targetRow.cells[col + 1];
    if (targetCell) targetCell.classList.add('matrix-active');
}
