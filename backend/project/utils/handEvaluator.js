// Ported from oblig1/components/dice-poker-board.js (class methods → standalone exports).
// Used by the backend to evaluate and compare Spanish Poker Dice hands server-side.

// Returns a numeric value for each face — used for sorting and tie-breaking.
// A is highest (6), 7 is lowest (1).
export function faceValue(face) {
    if (face === 'A') return 6;
    if (face === 'K') return 5;
    if (face === 'Q') return 4;
    if (face === 'J') return 3;
    if (face === '8') return 2;
    return 1;
}

// Returns hand type, rank, and tie-breakers for a set of 5 dice faces.
// Lower rank = better hand. includeStraight defaults to true.
export function evaluateHand(faces, includeStraight = true) {
    // Count how many of each face we have
    const counts = {};
    for (const face of faces) counts[face] = (counts[face] || 0) + 1;

    const entries = Object.entries(counts);

    // Sort by count descending, then by face value descending for tie-breaking
    entries.sort(([faceA, countA], [faceB, countB]) => {
        if (countB !== countA) return countB - countA;
        return faceValue(faceB) - faceValue(faceA);
    });

    const facesPattern = entries.map((entry) => entry[1]);
    const allDifferentFaces = entries.length === 5;

    // The two valid straights in Spanish Poker Dice
    const validStraights = ['78JQK', '8JQKA'];
    const sortedFaces = [...faces].sort((faceA, faceB) => faceValue(faceA) - faceValue(faceB));
    const isStraight = allDifferentFaces && includeStraight && validStraights.includes(sortedFaces.join(''));

    // Used as tie-breaker for Carta Alta (high card)
    const sortedValuesDescending = [...faces].sort((faceA, faceB) => faceValue(faceB) - faceValue(faceA)).map((face) => faceValue(face));

    // Check each hand type from best to worst
    if (facesPattern[0] === 5) {
        return {
            handType: 'Repóker',
            rank: 1,
            tie: [faceValue(entries[0][0])]
        };
    }

    if (facesPattern[0] === 4) {
        return {
            handType: 'Póker',
            rank: 2,
            tie: [faceValue(entries[0][0]), faceValue(entries[1][0])]
        };
    }

    if (facesPattern[0] === 3 && facesPattern[1] === 2) {
        return {
            handType: 'Full',
            rank: 3,
            tie: [faceValue(entries[0][0]), faceValue(entries[1][0])]
        };
    }

    if (isStraight) {
        return {
            handType: 'Escalera',
            rank: 4,
            tie: [faceValue(sortedFaces[sortedFaces.length - 1])]
        };
    }

    if (facesPattern[0] === 3) {
        const tieBreakers = entries
            .slice(1)
            .map((entry) => faceValue(entry[0]))
            .sort((valueA, valueB) => valueB - valueA);

        return {
            handType: 'Trío',
            rank: 5,
            tie: [faceValue(entries[0][0]), ...tieBreakers]
        };
    }

    if (facesPattern[0] === 2 && facesPattern[1] === 2) {
        const firstPair = faceValue(entries[0][0]);
        const secondPair = faceValue(entries[1][0]);

        return {
            handType: 'Doble Pareja',
            rank: 6,
            tie: [Math.max(firstPair, secondPair), Math.min(firstPair, secondPair), faceValue(entries[2][0])]
        };
    }

    if (facesPattern[0] === 2) {
        const tieBreakers = entries
            .slice(1)
            .map((entry) => faceValue(entry[0]))
            .sort((valueA, valueB) => valueB - valueA);
        
        return { 
            handType: 'Pareja', 
            rank: 7, 
            tie: [faceValue(entries[0][0]), ...tieBreakers] 
        };
    }

    return { handType: 'Carta Alta', rank: 8, tie: sortedValuesDescending };
}

// Compares two hands. 
// Returns 1 if hand1 wins, -1 if hand2 wins, 0 for a draw.
export function compareHands(player1hand, player2hand) {
    if (player1hand.rank !== player2hand.rank) 
        return player1hand.rank < player2hand.rank ? 1 : -1;

    // Same hand type — compare tie-breakers in order
    const maxLength = Math.max(player1hand.tie.length, player2hand.tie.length);

    for (let i = 0; i < maxLength; i += 1) {
        const player1TieValue = player1hand.tie[i] || 0;
        const player2TieValue = player2hand.tie[i] || 0;
        if (player1TieValue !== player2TieValue) return player1TieValue > player2TieValue ? 1 : -1;
    }

    return 0; // draw
}
