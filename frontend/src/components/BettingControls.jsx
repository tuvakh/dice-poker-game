import { useState, useEffect } from "react";
import Button from "./Button.jsx";

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
            <Button variant="plain" onClick={() => onBet('fold')}>Fold</Button>
            {/* 'Check' when no bet has been placed yet, 'Match' when someone has already bet */}
            <Button variant="plain" onClick={() => onBet('match')}>
                {bettingState.highestBet === 0 ? 'Check' : `Match (${bettingState.highestBet})`}
            </Button>
            {/* Raise is only available in wager games and only when you have more chips than the current bet */}
            {coinWager > 0 && bettingState.yourStack > bettingState.highestBet && (
                <>
                    <div className="game__bet-input">
                        <span>Bet:</span>
                        <input
                            type="number"
                            min={bettingState.highestBet + 1}
                            max={bettingState.yourStack}
                            value={betAmount}
                            onChange={event => setBetAmount(Number(event.target.value))}
                            onKeyDown={event => { if (event.key === 'Enter') onBet('bet', betAmount); }}
                        />
                    </div>
                    <Button variant="plain" onClick={() => onBet('bet', betAmount)}>Bet</Button>
                </>
            )}
        </div>
    );

}
