// Ported from oblig1/components/dice-poker-board.js (class methods → standalone exports).
// Used by the backend to evaluate and compare Spanish Poker Dice hands server-side.

// Lookup table: each face maps to a numeric value for sorting and tie-breaking
// A is highest (6), 7 is lowest (1)
const FACE_VALUES = { 'A': 6, 'K': 5, 'Q': 4, 'J': 3, '8': 2, '7': 1 };

export function faceValue(face) {
    return FACE_VALUES[face];
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

    // facesPattern is the sorted count array — e.g. [5] for Repóker, [4,1] for Póker, [3,2] for Full
    const facesPattern = entries.map((entry) => entry[1]);
    // allDifferentFaces is true when all 5 dice show a different face (no pairs at all)
    // This is required for a straight — you can't have a straight with a repeated face
    const allDifferentFaces = entries.length === 5;

    // The two valid straights in Spanish Poker Dice
    const validStraights = ['78JQK', '8JQKA'];
    const sortedFaces = [...faces].sort((faceA, faceB) => faceValue(faceA) - faceValue(faceB));
    const isStraight = allDifferentFaces && includeStraight && validStraights.includes(sortedFaces.join(''));

    // Used as tie-breaker for Carta Alta (high card)
    const sortedValuesDescending = [...faces].sort((faceA, faceB) => faceValue(faceB) - faceValue(faceA)).map((face) => faceValue(face));

    // Check each hand type from best to worst
    // 5 of a kind
    if (facesPattern[0] === 5) {
        return { 
            handType: 'Repóker', 
            rank: 1, 
            tie: [faceValue(entries[0][0])] 
        };
    }

    // 4 of a kind
    if (facesPattern[0] === 4) {
        return {
            handType: 'Póker',
            rank: 2,
            tie: [faceValue(entries[0][0]), faceValue(entries[1][0])]
        };
    }

    // 3 of a kind + a pair
    if (facesPattern[0] === 3 && facesPattern[1] === 2) {
        return {
            handType: 'Full',
            rank: 3,
            tie: [faceValue(entries[0][0]), faceValue(entries[1][0])]
        };
    }

    // Straight (5 different faces in one of the two valid sequences)
    if (isStraight) {
        return {
            handType: 'Escalera',
            rank: 4,
            tie: [faceValue(sortedFaces[sortedFaces.length - 1])]
        };
    }

    // 3 of a kind, no pair
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

    // Two pairs
    if (facesPattern[0] === 2 && facesPattern[1] === 2) {
        const firstPair = faceValue(entries[0][0]);
        const secondPair = faceValue(entries[1][0]);

        return {
            handType: 'Doble Pareja',
            rank: 6,
            tie: [Math.max(firstPair, secondPair), Math.min(firstPair, secondPair), faceValue(entries[2][0])]
        };
    }

    // One pair
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

    // No matches — highest card wins
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

// Calculates ELO delta for each player based on final standings
// Higher stack = win when comparing each pair of players
export function calculateEloDeltas(standings, users, eloK = 32) {
    const deltas = {};
    // Start every player's delta at 0
    standings.forEach(entry => { deltas[entry.userId] = 0; });

    // Compare every pair of players exactly once (standings[i] vs standings[j] where j > i)
    for (let i = 0; i < standings.length; i++) {
        for (let j = i + 1; j < standings.length; j++) {
            const userA = users.find(u => String(u._id) === standings[i].userId);
            const userB = users.find(u => String(u._id) === standings[j].userId);
            if (!userA || !userB) continue;

            // Standard ELO expected score: probability that A beats B given their rating difference
            const expected = 1 / (1 + Math.pow(10, (userB.eloRating - userA.eloRating) / 400));
            // Actual result: 1 if A ended with more chips (won), 0.5 if tied
            const actual = standings[i].stack === standings[j].stack ? 0.5 : 1;

            deltas[standings[i].userId] += eloK * (actual - expected);
            deltas[standings[j].userId] += eloK * (expected - actual);
        }
    }
    return deltas;
}
