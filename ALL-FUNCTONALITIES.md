# ALL FUNCTIONALITIES

## The App — Spanish Dice Poker Platform

---

## Authentication & Users

### What it does
- **Register** — create an account; verification email is sent automatically
- **Email verification** — user clicks link in email → account confirmed (non-blocking: existing users can still log in unverified)
- **Login** — validates credentials, issues an access token (1hr) and refresh token (30 days) as HTTP-only cookies
- **Auto token refresh** — when the access token expires, the frontend silently exchanges the refresh token for a new one; user never gets logged out mid-session
- **Logout** — clears cookies and invalidates the refresh token in the database
- **Forgot password** — sends a reset link to the email (neutral response regardless of whether account exists)
- **Reset password** — user clicks link, submits new password; old session is cleared immediately after

### How it works

**Registration flow:**
1. User submits the register form → frontend calls `POST /users/register`
2. Backend hashes the password (MD5 + global APP_SALT + a unique 128-bit random salt generated per user via `crypto.randomBytes(16)`)
3. User record is saved to MongoDB with the `passwordSalt` field stored alongside the hashed password
4. `sendVerificationEmail()` fires, building a link like `FRONTEND_URL/verify-email?code=<token>` and sending it via Nodemailer (Ethereal in dev)
5. User lands on `VerifyEmail.jsx` which reads the `?code` from the URL and calls `POST /users/verify` — on success it redirects to login after 2.5s

**Login flow:**
1. User submits email + password → `POST /users/login`
2. Backend finds the user, re-hashes the submitted password using the stored `passwordSalt`, and compares against the stored hash
3. On match: `generateAccessToken()` (1hr) and `generateRefreshToken()` (30 days) are created and set as `HttpOnly; SameSite=Strict` cookies
4. The refresh token is also saved to the `refreshToken` field on the User document so it can be revoked
5. Frontend `AuthContext` stores the user object in state; all subsequent API calls include `credentials: 'include'` so the cookies are sent automatically

**Token refresh flow:**
1. `fetchWithAuth()` makes a request; server returns 401 (expired access token)
2. An `isRefreshing` flag is set to prevent other simultaneous requests from also triggering refresh
3. Frontend calls `POST /users/refresh`; the refresh token cookie is sent automatically
4. Backend verifies the token's JWT signature AND checks the token matches what is stored in the database (so revoked tokens are rejected)
5. New access token is issued and set as a cookie; original request retries

**Password reset flow:**
1. User submits email on `ForgotPassword.jsx` → `POST /users/forgot-password`
2. Backend looks up the user, generates a short-lived reset token, and calls `sendPasswordResetEmail()` which sends a link like `FRONTEND_URL/reset-password?code=<token>`
3. User lands on `ResetPassword.jsx`, which reads `?code` from the URL
4. On submit: inputs are validated client-side first (length, match), then `POST /users/reset-password` is called with the code and new password
5. Backend verifies the code, hashes the new password with the existing user salt, saves it, and clears the reset token
6. Frontend calls `logout()` to clear any cached session, then redirects to login after 2s

---

## Lobby

### What it does
- Lists all **waiting** games the logged-in user is allowed to join (hides games they already joined, hides games outside their ELO range)
- **Filter chips** — filter by number of rounds, straights allowed/not, and time per turn (seconds)
- **Load more** — shows 6 games at a time, button loads the next 6
- **Polling** — refreshes game list every 8 seconds automatically
- Link to create a new game

### How it works

1. `usePolling(fetchGames, 8000)` fires `fetchGames()` immediately on mount, then every 8 seconds. Each call creates an `AbortController` signal passed to `getAllMatches()` so the in-flight request is cancelled if a new poll fires before the previous one finishes
2. `filterLobbyMatches(lobbyGames, user)` runs client-side: removes games the user already joined, and removes games where the user's ELO falls outside the game's min/max range
3. Filter state (`selectedRounds`, `selectedStraights`, `selectedSeconds`) is applied on top of the already-filtered list using `.filter()` — no extra API calls, just JavaScript
4. Filter options (rounds and seconds chips) are dynamically derived with `Array.from(new Set(...))` so they always reflect whatever game categories actually exist in the database
5. `visibleCount` starts at 6 and increases by 6 on each "Load more" click; it resets to 6 whenever a filter changes so you always see from the top of a new filtered result
6. Game categories are loaded once in a separate `useEffect` on mount for the filter chips; this is independent of the polling loop

---

## Game (Real-time Multiplayer)

### What it does
- **WebSocket connection** — game state is synced live between both players
- **Dice rolling** — players roll and hold dice over multiple rounds
- **Chess-clock timer** — each player has their own countdown; runs only on their turn
- **Betting** — players place coin wagers before the game starts; wager is locked once both join
- **Leaving a game** — if a player leaves, the game continues; the leaver forfeits their wager, the remaining player auto-rolls on the leaver's turns, and the leaver's timer stops immediately
- **ELO and coins update** — automatically updated in real-time when a match ends
- **Player count display** — waiting games show `1/2 players` on the card and on the in-game waiting screen

### How it works

**WebSocket server:**
1. The backend runs a `ws` WebSocket server alongside the Express HTTP server
2. When a player opens a game page, the frontend opens a WebSocket connection and sends a `join` message with the match ID and user token
3. The server puts both clients into a room (keyed by match ID) and broadcasts game state updates to everyone in the room

**Game state machine:**
- States: `waiting` → `betting` → `playing` → `finished`
- Each event (roll, hold dice, place bet, ready) is sent as a JSON message over the socket; the server validates the action, updates state, and broadcasts the new state to both players

**Chess clock:**
- Each player has a separate timer tracked server-side
- Only the active player's clock runs; on turn switch the server pauses one timer and starts the other
- If a timer hits zero the player forfeits that round

**Leaving:**
- Player closes tab or clicks leave → WebSocket `disconnect` event fires on the server
- Server marks the leaver's timer as stopped, awards the wager to the remaining player, and auto-rolls for the leaver on subsequent turns until the game finishes naturally

**ELO update:**
- On game finish the server calculates ELO delta (standard formula) and updates both User documents in MongoDB
- The result is sent over WebSocket so the frontend updates the displayed ELO immediately without a page refresh

---

## Home Page

### What it does
- **Platform activity stats** — games live right now, players active this week
- **Available games** — shows waiting games you can join (respects ELO and membership)
- **Top 5 ongoing games** — ranked by average ELO of participants; backfills with finished games if fewer than 5 are live
- **Upcoming tournaments** — preview of next 5 tournaments
- Uses **idle loading** — data fetching is deferred until the browser is idle so the initial paint isn't blocked

### How it works

1. `getIdleDelaySetter(setReady)` uses `window.requestIdleCallback` to wait until the browser has finished its initial paint before flipping `ready` to `true`. Falls back to `setTimeout(0)` in environments that don't support it. This means the hero image and layout render first, then data loads.
2. The main `useEffect` watches `ready` — it does nothing until `ready` is true, then fires `load()`
3. `load()` runs four requests in parallel via `Promise.all([...])`: waiting matches, ongoing matches, tournaments, activity. Activity failure is non-fatal (`.catch(() => null)`) so a broken stats endpoint doesn't break the whole page
4. `sortByAverageElo()` maps each match to add an `avgElo` field (sum of player ELOs divided by player count), then sorts descending
5. Top 5 logic: fill with ongoing games first; if fewer than 5 are ongoing, fetch that many finished games and append them
6. A `cancelled` flag in the cleanup prevents any `setState` calls from running if the user navigates away before the fetches finish

---

## Tournaments

### What it does
- **Tournament listing** — all tournaments with a search bar to filter by name
- **Individual tournament page** — shows participants, bracket, match schedule
- **Join / leave** — logged-in users can join; anonymous users cannot
- **Admin: create tournament** — set title, description, date, rounds, time controls, ELO restrictions, buy-in, and optional trophy image
- **Admin: edit tournament** — modify existing tournaments

### How it works

**Listing & search:**
- Search input is debounced (250ms) so the API is not called on every keystroke
- `GET /tournaments?search=<term>` returns matching tournaments filtered server-side

**Join / leave:**
- `POST /tournaments/:id/join` — backend checks the user is authenticated and within ELO range before adding them to the `participants` array
- Anonymous users are blocked both by frontend (`AdminRoute`-style check) and by backend auth middleware

**Creating a tournament (admin):**
1. Game categories are loaded on mount so the dropdown is populated before the admin starts filling the form
2. If the admin uploads a trophy image, `createTrophy()` is called first; the returned trophy ID is then passed to `createTournament()`
3. Optional fields (eloMin, eloMax, buyIn) are only included in the request body if the admin filled them in (spread with `...(value !== "" && { field: value })`)
4. On success, the admin is navigated to the new tournament's detail page

---

## User Profile & Games

### What it does
- View your own profile: ELO, coin balance, profile picture, trophies
- **User games history** — paginated list of your past matches

### How it works
- `GET /users/:id` returns the user's public profile data
- `GET /matches?userId=<id>&status=finished` returns the user's match history
- Pagination is handled server-side; the frontend tracks the current page in state and re-fetches when the page changes
- Profile picture is stored as a file path on the User model; the frontend renders `<img src={profileImage}>` if the field exists

---

## Leaderboard

### What it does
- Players ranked by ELO rating
- Shows profile picture if available, falls back to username initial

### How it works
- `GET /leaderboard` returns users sorted by `eloRating` descending
- Frontend maps over the list; each entry conditionally renders `<img>` if `player.profileImage` exists, otherwise a styled `<span>` with the first letter of the username
- Both the image and the initial badge are sized to exactly `3rem × 3rem` via CSS to keep alignment consistent

---

## Comments

### What it does
- Users can post comments on matches and tournaments
- Comments sync live via WebSocket
- **Admin** can search, view with timestamps, and delete any comment

### How it works
- `POST /comments` creates a comment with a `targetType` (match or tournament) and `targetId`
- The WebSocket server broadcasts the new comment to all clients watching that target, so comments appear without a page refresh
- Admin `Comments.jsx` fetches all comments via `GET /comments`, sorts them newest-first client-side, and paginates with a debounced search
- Delete calls `DELETE /comments/:id`; the page reloads after to reflect the removal

---

## Admin Dashboard

### What it does
- **Stats overview** — active matches in the last 24h, new signups in the last 7 days, active players, available games now
- **Security incidents** — table of suspicious login attempts (IP, user agent, timestamp); only shown if incidents exist

### How it works
- `getAdminStats()` and `getActivity()` are called in parallel via `Promise.all` on mount
- Stats come from `GET /admin/stats` which queries MongoDB for matches created in the last 24h and users registered in the last 7 days
- Security incidents are stored server-side when repeated failed login attempts are detected (rate limiting); the dashboard surfaces them from `stats.recentIncidents`
- The incidents table only renders if `stats.recentIncidents?.length > 0` so it doesn't show an empty section normally

---

## Admin User Management

### What it does
- Paginated list of all users with live search (debounced)
- **Ban / unban** a user
- **Change role** (user ↔ admin) — page reloads after to flush cached auth state

### How it works
- `useFetch` hook re-runs `GET /admin/users?page=X&search=Y` whenever `page` or `debouncedSearch` changes
- `useDebouncedValue(search, 250)` delays the search term by 250ms so the API only gets called when the admin stops typing
- Ban: `PATCH /admin/users/:id/ban` sets `banned: true` on the User document; banned users are rejected at login
- Role change: `PATCH /admin/users/:id/role` updates the `role` field; `window.location.reload()` forces a full page refresh so no stale cached user data lingers

---

## Trophies

### What it does
- Admin can upload a trophy image when creating a tournament
- Trophy is uploaded first, its ID is then attached to the tournament
- Trophy badges display on user profiles and tournament pages

### How it works
- `POST /trophies` accepts `multipart/form-data` with a `title` and `image` file
- The file is saved to the server's uploads folder; the Trophy document stores the file path
- When creating a tournament, the frontend calls `createTrophy()` first and uses the returned `_id` in the tournament payload
- Trophy images are displayed using the stored file path as the `src` of an `<img>` tag

---

## Weekly Coin Scheduler

### What it does
- Runs automatically on a cron schedule
- Awards coins to all users weekly
- Each user is processed individually — one failure doesn't stop the batch
- Logs how many users received coins and the total distributed

### How it works
- `server.js` sets up a cron job (using the `node-cron` package) that calls `grantWeeklyCoinsBatch()` once per week
- `grantWeeklyCoinsBatch()` fetches all users with `User.find({})` then iterates them one at a time
- Each user is passed to `applyWeeklyCoinGrant(user)` which checks if they are eligible (e.g. haven't already received coins this week) and adds coins to their balance
- Each user is wrapped in its own `try/catch` so an error on one account doesn't abort the loop
- Total coins distributed and number of users granted are logged to the console on completion

---

## 404 Page

### What it does
- Custom page shown for any route that doesn't exist

### How it works
- React Router's `<Route path="*">` catches any URL that doesn't match a defined route
- Renders `404.jsx` which displays a styled error message and a link back to the home page

---

## Security (cross-cutting)

### What it does
- **JWT-signed tokens** — role comes from verified token, cannot be spoofed
- **HTTP-only cookies** — tokens invisible to JavaScript (XSS protection)
- **Removed X-User-Role header** — the old header any user could fake is completely gone
- **Per-user password salts** — even identical passwords hash differently per user
- **Global APP_SALT** — database breach alone doesn't yield usable hashes
- **Rate limiting** — backend limits repeated requests to prevent abuse

### How it works

**JWT:**
- Token payload contains `userId`, `role`, and `type` (access or refresh)
- Signed with `process.env.JWT_SECRET` using HS256; any tampering with the payload invalidates the signature
- Backend middleware (`auth.js`) reads the `accessToken` cookie, calls `jwt.verify()`, and attaches the decoded user to `req.user`
- `role.js` middleware reads `req.user.role` — the role is from the verified token, not from anything the client sent

**HTTP-only cookies:**
- Set with `res.cookie('accessToken', token, { httpOnly: true, sameSite: 'strict' })`
- `httpOnly` means `document.cookie` and `localStorage` cannot access it — an XSS attack that runs JavaScript in the browser cannot steal the token
- `sameSite: 'strict'` prevents the cookie from being sent on cross-site requests (CSRF protection)

**Password hashing:**
- On registration: `generateSalt()` creates `crypto.randomBytes(16).toString('hex')` and stores it as `passwordSalt` on the User
- Hash formula: `MD5(password + APP_SALT + userSalt)` — computed in `hashPassword()` in `utils/hash.js`
- On login: `checkPassword(submitted, storedHash, userSalt)` re-hashes with the same salts and compares
- Two users with the same password produce completely different stored hashes because their salts differ

**Rate limiting:**
- Applied via Express middleware on sensitive routes (login, register, password reset)
- Tracks requests by IP; after a threshold of failed attempts, further requests are temporarily blocked and logged as security incidents
