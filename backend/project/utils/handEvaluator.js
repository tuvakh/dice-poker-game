const FACE_VALUES = { 'A': 6, 'K': 5, 'Q': 4, 'J': 3, '8': 2, '7': 1 };

function faceValue(face) {
    return FACE_VALUES[face];
}

export function evaluateHand(faces, includeStraight = true) {
    const counts = {};
    for (const face of faces) counts[face] = (counts[face] || 0) + 1;

    const entries = Object.entries(counts);

    entries.sort(([faceA, countA], [faceB, countB]) => {
        if (countB !== countA) return countB - countA;
        return faceValue(faceB) - faceValue(faceA);
    });

    const facesPattern = entries.map((entry) => entry[1]);
    const allDifferentFaces = entries.length === 5;

    const validStraights = ['78JQK', '8JQKA'];
    const sortedFaces = [...faces].sort((faceA, faceB) => faceValue(faceA) - faceValue(faceB));
    const isStraight = allDifferentFaces && includeStraight && validStraights.includes(sortedFaces.join(''));

    const sortedValuesDescending = [...faces].sort((faceA, faceB) => faceValue(faceB) - faceValue(faceA)).map((face) => faceValue(face));

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

export function compareHands(player1hand, player2hand) {
    if (player1hand.rank !== player2hand.rank) 
        return player1hand.rank < player2hand.rank ? 1 : -1;

    const maxLength = Math.max(player1hand.tie.length, player2hand.tie.length);

    for (let i = 0; i < maxLength; i += 1) {
        const player1TieValue = player1hand.tie[i] || 0;
        const player2TieValue = player2hand.tie[i] || 0;
        if (player1TieValue !== player2TieValue) return player1TieValue > player2TieValue ? 1 : -1;
    }

    return 0;
}

export function calculateEloDeltas(standings, users, eloK = 32) {
    const deltas = {};

    standings.forEach(entry => { deltas[entry.userId] = 0; });

    for (let i = 0; i < standings.length; i++) {
        for (let j = i + 1; j < standings.length; j++) {
            const userA = users.find(user => String(user._id) === standings[i].userId);
            const userB = users.find(user => String(user._id) === standings[j].userId);
            if (!userA || !userB) continue;

            const expected = 1 / (1 + Math.pow(10, (userB.eloRating - userA.eloRating) / 400));
            const actual = standings[i].stack === standings[j].stack ? 0.5 : 1;

            deltas[standings[i].userId] += eloK * (actual - expected);
            deltas[standings[j].userId] += eloK * (expected - actual);
        }
    }
    return deltas;
}
