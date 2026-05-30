## Why you can't play the lobby games
It's important to understand why for the oral exam.

A seeded game is just a database document. For a real game to work, two things need to exist simultaneously:
- A match document in MongoDB (status: "waiting")
- A live WebSocket connection from the player who created it

The seed creates only #1. There's no real person sitting on a WebSocket connection waiting. So when you join a seeded game:
- joinMatch adds you to the match in the DB ✓
- You connect to the WebSocket server ✓
- The server creates game state and waits for requiredPlayers connections
- The "other player" never connects — because they don't exist
- The game just waits forever in the "waiting for players" overlay.

### Worth noting for the seed: 
For a real game site. Seeded games obviously should'nt show up because they aren't joinable. so this is only for demo.