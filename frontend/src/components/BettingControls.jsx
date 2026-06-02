import { useState, useEffect } from "react";
import Button from "./Button.jsx";

// Shows the betting UI for the current bettor, or a waiting message for everyone else
export default function BettingControls({ bettingState, userId, coinWager, onBet, betTimeLeft, betTimedOut }) {
    // Pre-fill the bet input at highestBet + 1 (the minimum valid raise)
    const [betAmount, setBetAmount] = useState(bettingState.highestBet + 1);

    // When another player raises (highestBet changes via WebSocket), reset the input to the new minimum
    useEffect(() => {
        setBetAmount(bettingState.highestBet + 1);
    }, [bettingState.highestBet]);

    // Early return: not this player's turn, show a waiting message instead
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
            {/* betTimeLeft is null when there is no timer; 0 or above means the countdown is active */}
            {betTimeLeft !== null && (
                // --urgent style kicks in at 5 seconds to warn the player they're running out of time
                <span className={`game__bet-timer${betTimeLeft <= 5 ? ' game__bet-timer--urgent' : ''}`}>
                    {betTimeLeft}s
                </span>
            )}

            <Button onClick={() => onBet('fold')}>Fold</Button>

            {/* Label switches: "Check" when no one has bet yet (highestBet === 0), "Match" otherwise */}
            <Button onClick={() => onBet('match')}>
                {bettingState.highestBet === 0 ? 'Check' : `Match (${bettingState.highestBet})`}
            </Button>

            {/* Bet input: only shown when no one has bet yet — once a bet is open, others can only fold or match */}
            {coinWager > 0 && bettingState.highestBet === 0 && (
                <>
                    <Button onClick={() => onBet('bet', betAmount)}>Bet:</Button>
                    <input
                        className="game__bet-input"
                        type="number"
                        min={bettingState.highestBet + 1}
                        max={bettingState.yourStack}
                        value={betAmount}
                        // Number() converts the input's string value to a number before storing it
                        onChange={event => setBetAmount(Number(event.target.value))}
                        // Lets the player submit a bet by pressing Enter instead of clicking the button
                        onKeyDown={event => { if (event.key === 'Enter') onBet('bet', betAmount); }}
                    />
                </>
            )}
        </div>
    );
}
