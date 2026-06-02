# MARIE-EXPLAINED

This file walks through everything that was built in this project, commit by commit, organized into logical phases. It is meant to help you explain what was done and why during an exam.

---

## Phase 1 — Project Setup (Initial commits)

**Commits:** `e62ebdd`, `01034e3`, `a02bef0`, `f58050b`, `1b43fec`

The project started from a course-provided starter repo. The team:
- Added all their own backend and frontend files on top of the initial scaffold.
- Set up REST script files (`.http`) for manually testing every API route (users, matches, tournaments, trophies, comments, leaderboard, queue, activity).
- Added a `ToDo.md` to track what needed to be built.
- Connected MongoDB Atlas as the database (`db.config.js`).
- Documented where the starting code came from and wrote an installation guide.

The backend was structured with the standard MVC pattern: `models/`, `controllers/`, `services/`, `routes/`, `middleware/`.

---

## Phase 2 — Core Features

### Coin System — `550124c`
- Added a weekly scheduler that automatically awards coins to all users.
- Uses a cron-style job on the backend so coins are distributed without any manual trigger.
- Originally ran monthly, later changed to weekly (`95346a3`).

### Statistics on Homepage — `20bc691`
- Added platform-wide activity stats to the homepage: number of games played, active users, etc.
- Fetched from a dedicated `/activity` backend endpoint.

### 404 Page — `3564802`
- Added a custom 404 page component so users who navigate to a non-existent route see a proper error page instead of a blank screen.

### Leaderboard — `202866e`
- Added a full leaderboard page showing players ranked by ELO.
- Later deleted and rebuilt (`264e80a`) with profile picture support.

### Forgot Password / Email Verification — `fdbde2a`
- Added a "forgot password" flow: user submits email → backend sends a reset link → user clicks link → sets new password.
- Added email verification on account registration so new users confirm their email before logging in.
- Used Ethereal (fake SMTP) for dev/test so emails don't actually send but can be previewed.

### View All Games — `c3d3b4c`
- Fixed the "view all games" page to show all available games with proper pagination (max 10 per page).

### Admin Pages — `697fb65`
- Added admin-only dashboard pages for managing users, games, tournaments, and trophies.
- Admin routes protected behind role-based middleware.

---

## Phase 3 — Game Board and WebSocket Engine

This was the most complex feature block. Multiple commits across the `game-board` branch.

### WebSocket Server — `0d63228`, `3d41aad`
- Built a full WebSocket server (`ws` package) that handles real-time game state.
- Game events: rolling dice, betting, scoring, the chess-clock timer, and the ready flow.
- Each connected client joins a room keyed to their match ID.

### Multiplayer Match Data Model — `cfa4cca`
- Extended the `Match` model with: `coinWager` (betting amount), ELO delta fields, and time controls per player.

### Matchmaking Queue and Wager Locking — `07e2745`
- Added a matchmaking queue on the backend so players can wait for an opponent.
- Wager amounts are locked once both players join so they cannot be changed mid-game.

### Multiplayer Game Page — `4c696dd`
- Built the main in-game React page with live WebSocket integration.
- Shows both players' boards, the active timer, and the betting UI side by side.

### Dice Poker Board Web Components — `fbe7062`
- Added `dice-poker-board` and `dice-poker-die` as native Web Components so the dice visuals are self-contained and reusable.

### Lobby and Home Updated — `530219e`
- Updated lobby and home pages to reflect multiplayer game categories and time controls.

### Leaving a Game — `753c916`, `4a70cd0`, `d64cb80`
- Fixed the leave-game flow: when a player leaves, the game continues with the remaining player auto-rolling.
- The timer for the player who left stops immediately so the other player is not penalized.
- The leaver forfeits their wager and the opponent is credited.

### Merge Queue into Lobby — `945a305`, `d448ab8`
- Removed the separate queue page entirely and folded it into the lobby.
- Fixed an authorization bug: users are now automatically logged out if they close the browser tab.

### ELO and Coins Auto-Update — `160f46b`
- Fixed so ELO rating and coin balance update in real-time on the frontend when a match ends, without needing a page refresh.

---

## Phase 4 — Tournaments

### Tournament Page — `2ef9e43`, `c0e8ee0`, `153a9a2`
- Added a Tournaments listing page showing all active and upcoming tournaments.
- Added background music and a sound toggle across the site (later removed — `bc9d901`).
- Users can join or leave tournaments from the listing page.
- Anonymous users cannot join.

### Individual Tournament Page — `bb421a8`
- Each tournament gets its own detail page showing participants, bracket status, and match schedule.

### Search on Tournament List — `ff4a01d`
- Added a search bar to filter tournaments by name on the tournament listing page.

### Tournament Admin Features — `2222c55`, `9dd5b10`, `b3eb380`
- Admin can create, edit, and delete tournaments from the admin dashboard.
- Added a dedicated tournament-admin page with tournament management components.
- Added arrows/navigation for tournament pages (`9039c55`).

### Tournament Hero Fix — `6c0e0da`
- Fixed the hero banner section on the tournament page that was broken after a merge.

### Tournament Bugs — `8098138`, `7945c2d`
- Fixed several small bugs: bracket display issues, player joining edge cases, tournament state management.

---

## Phase 5 — Authentication and Security

This phase replaced the insecure original auth with a production-ready system.

### Removed X-User-Role Header — `a4496ac` and later cleanup
- The original code sent a `X-User-Role: admin` HTTP header from the client to claim admin privileges.
- Any user could open DevTools and add that header to get admin access — a critical vulnerability.
- Removed `getAuthHeaders()` from `api/config.js` and stripped the header from all 8 API modules.
- Backend `role.js` middleware was updated to read the user's role from the verified JWT token instead.

### JWT Authentication — `3990ac0`, `27079d0`
- Replaced the old bearer token pattern with signed JWTs.
- Tokens are stored in HTTP-only cookies so JavaScript cannot access them (XSS protection).
- Backend middleware verifies the token signature — tokens cannot be forged without the server secret key.

### Access + Refresh Token System — (commits in FIX--Email-verificaton and later merges)
- Upgraded from a single 7-day token to a two-token system:
  - **Access token** (1 hour): sent with every request via HTTP-only cookie.
  - **Refresh token** (30 days): also HTTP-only cookie, stored in the database so it can be revoked on logout.
- Added `/users/refresh` endpoint: when the access token expires, the frontend silently calls this endpoint to get a new one without the user needing to log in again.
- Frontend `fetchWithAuth()` intercepts 401 responses and automatically retries after refreshing the token.
- An `isRefreshing` flag prevents infinite refresh loops.

### Email Verification Gate Removed for Existing Users
- New accounts still get a verification email on registration.
- Removed the gate that blocked existing users from logging in if they hadn't verified yet.
- Existing users can log in and verify later.

### MD5 Password Hashing with Salting
- Upgraded from plain/unsalted hashing to a defence-in-depth approach:
  - **Global salt** (`APP_SALT` env var): applied to all passwords, so a database dump alone is not enough.
  - **Per-user salt**: a unique 128-bit random salt (`crypto.randomBytes(16)`) generated per user on registration and stored in the `passwordSalt` field on their record.
  - Even if two users share the same password, the stored hashes are different.
- Implemented in `utils/hash.js`: `generateSalt()`, `hashPassword()`, `checkPassword()`.
- Pre-validate hook on the User model automatically salts and hashes the password on every save.
- `loginUser()` and `resetPassword()` pass the stored salt to the verification function.

---

## Phase 6 — UX and Polish

### Confirmation Message — `65259b7`, `e6dc2fe`, `358ff4f`
- Added a confirmation modal that appears when a user tries to take a destructive action (e.g., leave game, delete something).
- Fixed a bug where the confirmation message was scrollable when it should have been fixed/modal.

### Betting Timer — `84a3f79`, `f0dac12`, `1cd2b35`
- Added a visible countdown timer to the betting phase so players know how long they have to place a wager.
- Fixed a timer overlap bug where two timers would run simultaneously.

### Comments with Timestamps — `d497727`
- Admin comments on matches now show the date and time they were posted.

### Sound Effects and Dice Animation — `b1bb933`
- Added sound effects for dice rolls and other game events.
- Added a dice roll animation so the dice visually "tumble" before showing the result.
- Background music was added then later removed in favour of just sound effects.

### Trophies and Badges — `40e79b9`, `bc9d901`
- Admin can add trophy images to tournaments.
- Trophy images are displayed in the tournament page and in the user profile.
- Images migrated to `.webP` format for better performance.

### Automatic Logout — `40e79b9`
- Users are automatically logged out when they close the browser or after inactivity.

### Profile Picture on Leaderboard — `0d0ad1d`
- The leaderboard previously only showed a user's initials.
- Updated `LeaderBoard.jsx` to display the stored `profileImage` when available, falling back to initials.
- Both profile images and initial badges are sized consistently at `3rem × 3rem` via `_LeaderBoard.scss`.

### Player Count on Game Cards — `951bd18`
- Game cards in the lobby and home page now show how many players have joined vs. how many are needed (e.g. "1/2 players").
- Only shown for waiting-status games; not shown in "top games" or "recent games" contexts.

### Player Count on In-Game Waiting Screen
- When waiting for opponents, the in-game overlay now shows the current player count (e.g. "Waiting... 1/2 players").

### Homepage Cleanup
- Collapsed the split `Home.jsx` + `HomeDetails.jsx` structure back into a single `Home.jsx` with all data fetching, ELO sorting, and idle-loading deferral.

### Caching Fix — `ffa5c7f`
- Fixed an issue where the whole page was being cached, causing stale data to appear after navigating.

---

## Phase 7 — Styling (Multiple PRs)

PRs #20 through #30 were all styling branches. Key work:

- Styled the gameboard, 404 page, lobby, leaderboard, home, and tournament pages.
- Cleaned up double leave-button display issue (`66db423`).
- Fixed gameboard styling regressions across multiple merges (`93843b2`).
- Added arrow navigation for tournament pages.
- Converted images to `.webP` for performance.
- Overall visual polish and responsiveness.

---

## Phase 8 — Performance and Optimization

**Commits:** `4f77469`, `1318ef3`

- Tried several approaches to reduce initial load time and bundle size.
- Converted images to `.webP` format.
- Added lazy loading / deferred loading for non-critical sections of the homepage.

---

## Phase 9 — Seed Data and Testing

- Created `match.seed.js` to generate 10 finished test matches where a specific test user wins all games.
- ELO deltas set to `+24` for winner, `-24` for opponent.
- Makes it easy to test leaderboard ranking and win streak display.
- Run with `npm run seed`.

---

## Summary of the Full Commit History

| Phase | Key commits | What it built |
|---|---|---|
| Setup | `e62ebdd` → `a02bef0` | Scaffold, REST scripts, MongoDB, ToDo |
| Core features | `550124c`, `202866e`, `fdbde2a`, `c3d3b4c`, `697fb65` | Coins, leaderboard, forgot password, admin pages |
| Game board | `0d63228`, `4c696dd`, `753c916`, `160f46b` | WebSocket engine, multiplayer, leaving game, ELO |
| Tournaments | `2ef9e43`, `bb421a8`, `2222c55`, `b3eb380` | Tournament listing, individual pages, admin management |
| Auth & Security | `a4496ac`, `3990ac0`, `fdbde2a` and FIX-Email branch | JWT cookies, refresh tokens, salted passwords, removed X-User-Role |
| UX & Polish | `65259b7`, `84a3f79`, `b1bb933`, `40e79b9`, `0d0ad1d`, `951bd18` | Confirmation dialogs, timers, sounds, trophies, profile pics, player counts |
| Styling PRs | PRs #20–#30 | Visual polish across all pages |
| Performance | `4f77469`, `1318ef3`, `ffa5c7f` | webP images, lazy loading, cache fix |
| Seed data | match.seed.js commits | Test data for ELO and leaderboard testing |

---

## Security Changes — Quick Reference for Exam

| What was vulnerable | How it was fixed |
|---|---|
| `X-User-Role` header — anyone could claim admin | Removed entirely; role now comes from signed JWT |
| Tokens stored in localStorage — XSS could steal them | Moved to HTTP-only cookies |
| Single long-lived token (7 days) | Split into access (1hr) + refresh (30 days) with DB revocation |
| Passwords not properly salted | Added global APP_SALT + per-user 128-bit random salt via `crypto.randomBytes` |
| Frontend reading role from client state | Backend middleware reads role from verified token only |
| No automatic refresh — users get logged out mid-session | `fetchWithAuth()` auto-retries on 401 with token refresh |
