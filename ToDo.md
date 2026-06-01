# TODO
1. ✅ GAME BOARD & MECHANICS --> Tuva
2. ✅ REAL-TIME GAMEPLAY(websockets) --> Tuva
3. ✅ LEADERBOARDS PAGE --> Marie
4. ✅ TOURNAMENTS PAGE --> Chanya
        ✅ No pagination / load-more button
        ✅ No sorting (by date, title, # of players)
        ✅ No search (by title after 3 chars)
        ✅ Cards missing: author, trophy, game variant
5. ✅ MATCHMAKING QUEUE --> Chanya
6. ✅ Stats on homepage --> Marie
7. ✅ forgot password --> Marie
8. ✅ More games on user page --> Marie
9. ✅ Work needed on ELO system
10. ✅ Sound --> Chanya
11. ✅ Upcoming tournaments on homepage (sortable and searchable) --> Tuva
12. ✅ Individual tournament page --> Chanya
        ✅ Trophy won't show — getTournament never calls .populate('trophy')
        ✅ Game variant not shown — .populate('gameCategory') also missing
        ✅ eloMin, eloMax, buyIn — schema fields don't exist yet
        ❌ standings section for ongoing tournaments
        ✅ admin edit buttons on page -- Chanya
        ✅ backend endpoints for edit -- Chanya
        ✅ Leave at any point is BROKEN — service throws if status !== "upcoming" (opposite of requirement)
        ❌ auto-redirect players to their game
        ✅ countdown to next round -- Chanya
        ✅ Tournament format is KNOCKOUT not round-based points — all players should play every round, winner by total points accumulated

        ❌ Users can only join a tournament before it starts.
        ❌ Users can leave a tournament at any point.
        ❌ Players (the users that have joined the tournament) are automatically re-directed from the tournament page to a game page and back (upon game completion). Other users are instead shown the list of on-going games in the tournament. They click on any game and view it.
        ❌ The tournament page shows a countdown till the next round of games starts.
        ❌ Only one type of tournaments has to be implemented[^1], random-pairing round-based tournaments: a tournament has a fixed number of rounds (the rounds here are a different concept from the in-game rounds[^2]) and players are assigned into games randomly. The process is repeated for each round. 
        ❌ The ranking and tournament winner are determined based on the number of points obtained in it.
Players may be given some extra points (see the point on points below) for winning a tournament.
13. ✅ Filtering on lobby page --> Marie
14. ✅ Leaving game before it starts --Tuva
15. ✅ In game money(gambelinggg), needs to be shown on player page. --> Marie
16. ✅ More game varients. --> Tuva
17. ✅ Authentication and authorization --> Marie
        ✅ No JWT — login returns raw user object in sessionStorage
        ✅ No access/refresh tokens
        ✅ Authorization faked — anyone can send X-User-Role: admin header and get full access
        ✅ MD5 + global salt — two users with same password get same hash; needs per-user salt (bcrypt)
18. ✅ implement a 404 page --> Marie
19. ✅ Implement comments using websockets --> Tuva
20. ✅ Show platform activity on homepage --> Chanya
21. ✅ 4 admin pages --> Marie
        ✅ Dashboard, Users, Comments, TournamentCreate exist
        ✅ Admin pages show full header + footer — should show only logo + admin nav, no footer
        ✅ TournamentCreate doesn't redirect to the new tournament after submit
        ✅ TournamentCreate missing eloMin, eloMax, buyIn fields
        ✅ Security incidents not implemented — rate limit hits need logging to DB (IP, user agent, timestamp)
        ✅ Dashboard doesn't show platform activity stats (same as homepage)
22. ✅ anonymous can no longer play just spectate --> Tuva
23. ✅ Focus on match making switches focus from queue to "rooms" where player can join and wait for other players to join. --> Chanya
24. ✅ verify email when register --> Marie


- ✅ exstra: maybe a back button when entering game? to go back to home page/leave? --> Tuva

- ❌ when rolled 3 times the round should automatically end, you should have to click end roll.
- ❌ add a border around profile picture incase someone has a transparent background on their profile picture.
- ✅ be able to add a throphy on turnament creation, and show it on the tournament page - chanya
- ❌ limited time to bet.
- ❌ Error messages on light mode has bad readability
- ✅ Should automatically logout, when we reseed the database and the user don't exist anymore - chanya
- ❌ When watching a game you shouldn't see the buttons
- ✅ Confirmation message when leaving game - chanya
- ❌ Test everything to see if both functionality and styling works (both light and dark mode)
