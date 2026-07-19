import { useState, useEffect } from "react";
import Button from "./Button.jsx";

export default function BettingControls({ bettingState, userId, coinWager, onBet, betTimeLeft, betTimedOut }) {
    const [betAmount, setBetAmount] = useState(bettingState.highestBet + 1);

    useEffect(() => {
        setBetAmount(bettingState.highestBet + 1);
    }, [bettingState.highestBet]);

    if (bettingState.currentBettor !== userId) {
        return (
            <p className="game__ready-waiting">
                {betTimedOut
                    ? "Too slow! Waiting for opponent to bet..."
                    : "Waiting for opponent to bet..."}
            </p>
        );
    }

    return (
        <div className="game__bet-actions">
            {betTimeLeft !== null && (
                <span className={`game__bet-timer${betTimeLeft <= 5 ? ' game__bet-timer--urgent' : ''}`}>
                    {betTimeLeft}s
                </span>
            )}

            <Button onClick={() => onBet('fold')}>Fold</Button>

            <Button onClick={() => onBet('match')}>
                {bettingState.highestBet === 0 ? 'Check' : `Match (${bettingState.highestBet})`}
            </Button>

            {coinWager > 0 && bettingState.highestBet === 0 && (
                <>
                    <Button onClick={() => onBet('bet', betAmount)}>Bet:</Button>
                    <input
                        className="game__bet-input"
                        type="number"
                        min={bettingState.highestBet + 1}
                        max={bettingState.yourStack}
                        value={betAmount}
                        onChange={event => setBetAmount(Number(event.target.value))}
                        onKeyDown={event => { if (event.key === 'Enter') onBet('bet', betAmount); }}
                    />
                </>
            )}
        </div>
    );
}
