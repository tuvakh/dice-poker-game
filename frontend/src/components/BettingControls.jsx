import { useState, useEffect } from "react";

// Displays the betting UI for the current player's turn, or a waiting message otherwise
export default function BettingControls({ bettingState, userId, coinWager, onBet }) {
    // Keeps the bet input pre-filled at one above the current highest bet whenever it changes
    const [betAmount, setBetAmount] = useState(bettingState.highestBet + 1);

    useEffect(() => {
        setBetAmount(bettingState.highestBet + 1);
    }, [bettingState.highestBet]);

    // Not this player's turn — show a waiting message instead of the betting controls
    if (bettingState.currentBettor !== userId) {
        return <p>Waiting for opponent to bet...</p>;
    }

    return (
        <div className="game__bet-actions">
            <p>Your turn</p>
            <button onClick={() => onBet('fold')}>Fold</button>
            {/* 'Check' when no bet has been placed yet, 'Match' when someone has already bet */}
            <button onClick={() => onBet('match')}>
                {bettingState.highestBet === 0 ? 'Check' : `Match (${bettingState.highestBet})`}
            </button>
            {/* Raise is only available in wager games and only when you have more chips than the current bet */}
            {coinWager > 0 && bettingState.yourStack > bettingState.highestBet && (
                <div className="game__bet-input">
                    <input
                        type="number"
                        min={bettingState.highestBet + 1}
                        max={bettingState.yourStack}
                        value={betAmount}
                        onChange={event => setBetAmount(Number(event.target.value))}
                    />
                    <button onClick={() => onBet('bet', betAmount)}>Bet</button>
                </div>
            )}
        </div>
    );
}
