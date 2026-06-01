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
        ✅ No standings section for ongoing tournaments
        ✅ No admin delete/cancel/edit buttons on page
        ✅ No backend endpoints for delete/cancel/edit
        ✅ Leave at any point is BROKEN — service throws if status !== "upcoming" (opposite of requirement)
        ✅ No auto-redirect players to their game
        ✅ No countdown to next round
        ✅ Tournament format is KNOCKOUT not round-based points — all players should play every round, winner by total points accumulated
        ✅ No extra coin bonus for winning a tournament
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
25. ✅ verify email when register --> Marie


- ✅ exstra: maybe a back button when entering game? to go back to home page/leave? --> Tuva

- when rolled 3 times the round should automatically end, you should have to click end roll.
- add a border around profile picture incase someone has a transparent background on their profile picture.
- ✅ be able to add a throphy on turnament creation, and show it on the tournament page - chanya 
- limited time to bet. 
- Error messages on light mode has bad readability
- ✅ Should automatically logout, when we reseed the database and the user don’t exist anymore - chanya 
- When watching a game you shouldn’t see the buttons
- ✅ Confirmation message when leaving game - chanya 
- Test everything to see if both functionality and styling works (both light and dark mode) 
