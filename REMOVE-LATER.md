## Playing the game functionality:
Implement a game board component (and all necessary nested components, e.g., Player and Die) using Web Components.
- Wrap the game board component in a React component if necessary. Ensure that the state of the game is restored on page reload/navigation.

Rolls are generated on the backend and sent to the frontent. 
- The frontend only communicates held dice. 
- The backend estimates the winner based on the rolls and holds, and enforces time if needed. (done)

(done)
The info about rolls and holds is communicated via Web Sockets (or any other technology suitable for low-latency message exchange on the web). 
- Other's rolls and holds are communicated (and rendered) to all players as quickly as possible.

The number of players should be between 2 and 5. 

The game starts automatically once the required number of player clicked "join" the game.

(done)
The rolls of others are not revealed to the player. This allows for bluffing. 
- Only the backend knows all rolls and holds before the dice are revealed at the end of a round.

### Implement betting: 
Players look at their dice and bet an amount of their points (aka, put these points in the pot). 

Others look and their own dice and either match the amount, fold (already bet points are not returned and remain in the pot), or raise (increase the amount of bet points further). 

The dice are revealed when everyone either folder or have matched the highest bet amount. 

The winner collects the points from the pot (draws lead to splitting points). 

After the end of all rounds (aka, game end), the amounts in individual player's stacks are added back to the points the user has on their profile.

A player needs to have enough points on their profile for a "buy-in" - the amount that is reserved from their profile and what they start the game with - to join a game.

Elo is re-estimated at the end of the game. 
- You will need to adapt the algorithm to having more than 2 players: 
  - run the original Elo re-estimation algorithms for each pair of players
  - a player "loses" pairings against others who ended up with more points and "wins" the pairings against those with fewer points.

If a player runs out of time (or abandons the game), the dice are still rolled for them, but they can't hold any or re-roll, and always match the amount in the pot.

If you are unsure about the rules of Spanish Poker Dice, consult online sources (e.g., encyclopedias).

If the user enabled sounds (using the settings button in the header), sounds are played for round starts and ends, rolls, holds, and game end.