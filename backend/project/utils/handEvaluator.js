export function faceValue(face) {
    if (face === 'A') return 6;
    if (face === 'K') return 5;
    if (face === 'Q') return 4;
    if (face === 'J') return 3;
    if (face === '8') return 2;
    return 1;
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
    const uniqueFaces = entries.length;
    const allDifferentFaces = uniqueFaces === 5;

    const validStraights = ['78JQK', '8JQKA'];

    const sortedFaces = [...faces].sort((faceA, faceB) => faceValue(faceA) - faceValue(faceB));

    const sortedFacesString = sortedFaces.join('');

    const isStraight = allDifferentFaces && includeStraight && validStraights.includes(sortedFacesString);

    const sortedValuesDescending = [...faces]
        .sort((faceA, faceB) => faceValue(faceB) - faceValue(faceA))
        .map((face) => faceValue(face));

    if (facesPattern[0] === 5) {
        const fiveOfAKind = faceValue(entries[0][0]);

        return {
            handType: 'Repóker',
            rank: 1,
            tie: [fiveOfAKind]
        };
    }

    if (facesPattern[0] === 4) {
        const fourOfAKind = faceValue(entries[0][0]);
        const tieBreaker = faceValue(entries[1][0]);

        return {
            handType: 'Póker',
            rank: 2,
            tie: [fourOfAKind, tieBreaker]
        };
    }

    if (facesPattern[0] === 3 && facesPattern[1] === 2) {
        const threeOfAKind = faceValue(entries[0][0]);
        const pair = faceValue(entries[1][0]);

        return { handType: 'Full', rank: 3, tie: [threeOfAKind, pair] };
    }

    if (isStraight) {
        const highestFaceValue = faceValue(sortedFaces[sortedFaces.length - 1]);
        return {
            handType: 'Escalera',
            rank: 4,
            tie: [highestFaceValue]
        };
    }

    if (facesPattern[0] === 3) {
        const threeOfAKind = faceValue(entries[0][0]);
        const tieBreakers = entries
            .slice(1)
            .map((entry) => faceValue(entry[0]))
            .sort((valueA, valueB) => valueB - valueA);
        return { handType: 'Trío', rank: 5, tie: [threeOfAKind, ...tieBreakers] };
    }

    if (facesPattern[0] === 2 && facesPattern[1] === 2) {
        const firstPair = faceValue(entries[0][0]);
        const secondPair = faceValue(entries[1][0]);
        const highPair = Math.max(firstPair, secondPair);
        const lowPair = Math.min(firstPair, secondPair);
        const tieBreaker = faceValue(entries[2][0]);
        return { handType: 'Doble Pareja', rank: 6, tie: [highPair, lowPair, tieBreaker] };
    }

    if (facesPattern[0] === 2) {
        const pair = faceValue(entries[0][0]);
        const tieBreakers = entries
            .slice(1)
            .map((entry) => faceValue(entry[0]))
            .sort((valueA, valueB) => valueB - valueA);
        return { handType: 'Pareja', rank: 7, tie: [pair, ...tieBreakers] };
    }

    return { handType: 'Carta Alta', rank: 8, tie: sortedValuesDescending };
}

export function compareHands(player1hand, player2hand) {
    if (player1hand.rank !== player2hand.rank) return player1hand.rank < player2hand.rank ? 1 : -1;

    const player1Tie = player1hand.tie;
    const player2Tie = player2hand.tie;
    const maxLength = Math.max(player1Tie.length, player2Tie.length);

    for (let i = 0; i < maxLength; i += 1) {
        const player1TieValue = player1Tie[i] || 0;
        const player2TieValue = player2Tie[i] || 0;
        if (player1TieValue !== player2TieValue) return player1TieValue > player2TieValue ? 1 : -1;
    }

    return 0;
}
