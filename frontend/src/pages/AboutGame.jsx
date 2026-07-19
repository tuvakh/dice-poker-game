import Hero from "../components/Hero.jsx";

export default function AboutGame (){
    return (
        <>
        <Hero title="About the game" heroImg="/rules-hero.webp">
            <p>A two-player game of strategy, bluffing, and luck</p>
        </Hero>

        <section className="information-page">
            <h2>What is Spanish Dice Poker?</h2>
            <p>Spanish Dice Poker is a two-player bluffing and strategy game played with five dice per player. Each die has six faces representing playing card values, and the goal is to form the best poker hand from your dice (or convince your opponent you have.)</p>
        
            <h3>The Dice</h3>
            
            <p>Each player rolls five dice, kept hidden from their opponent.</p> 
            <h4>The faces from lowest to highest are:</h4>
            <ul>
                <li>7 (lowest)</li>
                <li>8</li>
                <li>J — Jack</li>
                <li>Q — Queen</li>
                <li>K — King</li>
                <li>A — Ace (highest)</li>
            </ul>

            <h2>How a Round Works</h2>
            <p>At the start of each round, both players roll all five of their dice. You then have up to two extra rolls (three in total) to improve your hand. Between rolls, you can hold any dice you want to keep and re-roll the rest. Once both players have finished rolling, the hands are compared and the player with the better hand wins the round.</p>
        
            <h3 className="rules-h3">Winning the Match</h3>
            <p>Matches are played as best of 3, 5, or 7 rounds, and the first player to win the majority of rounds wins the match. In a best of 3 you need 2 round wins, in a best of 5 you need 3, and so on.</p>
            <p>Every match result affects your Elo rating: Beating a higher-rated opponent earns more points, while losing to a lower-rated one costs more.</p>
        
            <h3 className="rules-h3">Hand Rankings</h3>
            <p>Hands are ranked from best to worst. When two players tie on hand type, the higher face value wins.</p>
            <ol>
                <li>Repóker (Five of a Kind) — all five dice show the same face</li>
                <li>Póker (Four of a Kind) — four matching dice and one different</li>
                <li>Full (Full House) — three of one face and two of another</li>
                <li>Escalera (Straight) — all five dice different, in sequence: 7-8-J-Q-K or 8-J-Q-K-A</li>
                <li>Trío (Three of a Kind) — three matching dice</li>
                <li>Doble Pareja (Two Pairs) — two different pairs</li>
                <li>Pareja (One Pair) — two matching dice</li>
                <li>Carta Alta (High Card) — no combination, highest die wins</li>
            </ol>

            <h3 className="rules-h3">Game Variants</h3>
            <p>When creating a game you choose three things that define the variant: how long the match is, whether straights are allowed, and how much time each player gets per turn.</p>
            <p><strong>Best of 3, 5, or 7</strong> — the first player to win the required number of rounds wins the match.</p>
            <p><strong>No straights</strong> — straights are removed from the rankings entirely, making Five of a Kind and Four of a Kind easier to aim for.</p>
            <p><strong>Time controls</strong> — each player has a total time budget of 10, 30, or 90 seconds across all their rolls in the match. If the timer runs out, all remaining dice are rolled automatically with no holds.</p>
        </section>

        </>
    );
}