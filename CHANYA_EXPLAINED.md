# Chanya's Contributions — In Depth

This document explains everything I (Chanya) implemented for the exam project. It covers what each piece of code does, why I made the decisions I did, and how the different parts connect to each other.

---

## 1. Tournament List Page — `frontend/src/pages/Tournament.jsx`

This is the page users land on when they click "Tournaments" in the nav. It shows all tournaments and lets users filter, search, sort, and load more.

### Status tabs
I defined a `STATUS_TABS` array at the top of the file with four possible statuses: All, Upcoming, Ongoing, Finished. Each tab is a `<button>` that sets `statusFilter` state. When the filter changes, the `useEffect` re-runs and fetches from the backend with that status as a query param.

```js
const params = statusFilter ? { status: statusFilter } : {};
getAllTournaments(params).then(data => setTournaments(data.tournamentList ?? []));
```

If no filter is selected, `params` is an empty object and all tournaments are returned.

### Search
I added a text `<input>` that sets `searchQuery` state. Search only activates when the user has typed 3 or more characters — the exam spec says "at least 3 characters entered". The filtering is done inside `useMemo` on the client side so there is no extra API call for every keystroke.

```js
if (searchQuery.length >= 3) {
    const query = searchQuery.toLowerCase();
    list = list.filter(t => t.title.toLowerCase().includes(query));
}
```

### Sort
I defined a `SORT_OPTIONS` array with six sort choices (date ascending/descending, title A-Z/Z-A, players most/fewest). Sorting is also done client-side inside the same `useMemo` as search, using a `switch` statement. I used `localeCompare` for title sorting so accented characters are handled correctly.

### Load more (pagination)
Instead of page numbers I used a `visibleCount` state that starts at 6. The rendered list is always `visibleTournaments.slice(0, visibleCount)`. A "Load more" button adds 6 more each time it is clicked:

```js
<Button onClick={() => setVisibleCount(prev => prev + 6)}>Load more</Button>
```

The button only shows when there are more tournaments than `visibleCount`. When the user changes the status tab, `visibleCount` resets to 6 so they start fresh on each tab.

---

## 2. Tournament Card Component — `frontend/src/components/TournamentCard.jsx`

A reusable card that renders a single tournament as a clickable link. It shows:
- Status badge (colour changes via CSS class based on status)
- Title
- Date (formatted with `toLocaleDateString`)
- Participant count
- Number of rounds
- Game variant: game rules + time controller (e.g. "Straights · 30s")
- Trophy image — uses `<img src={/${tournament.trophy.image}} />` so the image comes from the `/public/` folder of the frontend

The card links to `/tournament/:tournamentId` using React Router's `<Link>`.

---

## 3. Individual Tournament Page — `frontend/src/pages/TournamentPage.jsx`

This is the most complex page I built. It loads a single tournament by its ID from the URL and shows full detail.

### Data loading
On mount (or when the URL `id` changes), it calls `getTournament(id)` and stores the result in state. A second `useEffect` loads comments once the tournament's `_id` is known.

### Real-time comments via WebSocket
A third `useEffect` opens a WebSocket connection to `ws://localhost:3000` and sends a `join-tournament` message with the tournament's MongoDB `_id`. When the server broadcasts a `new-comment` message, the new comment is appended to the local `comments` state without needing a page reload. The socket is closed when the component unmounts via the cleanup function.

### Join / Leave
- **Join**: Only shown for upcoming tournaments to users who are not already registered. Calls `joinTournament(id, user._id)`. On success, I do an **optimistic update** — instead of re-fetching the whole tournament, I add the user directly to the local `participants` array. This feels instant.
- **Leave**: Shown whenever the user is registered AND the tournament is not finished or cancelled. Also uses an optimistic update (removes user from local participants array).
- Both buttons disable during the async call to prevent double-clicks.

### Admin controls
When `user?.role === 'admin'` and the tournament is not already finished or cancelled, two buttons appear:
- **Cancel tournament** — calls `cancelTournament(id)` and updates local status to `"cancelled"`
- **Delete tournament** — calls `deleteTournament(id)` and navigates back to `/tournament`

Both prompt a `window.confirm` first so admins don't accidentally delete things.

### Info grid
A CSS grid shows key tournament details at a glance: date, number of rounds, break time, participant count. I conditionally render `eloMin`, `eloMax`, `buyIn`, and `gameCategory` only when they are not null/zero, so the grid stays clean for tournaments that don't use those fields.

### Trophy section
Shown only when a trophy exists. The image is served as a static file from `/frontend/public/` — the Trophy model stores just the filename (e.g. `spring-trophy.png`) so the `src` becomes `/${tournament.trophy.image}`.

### Countdown to next round
When a tournament is ongoing and the latest round's matches are all finished but more rounds remain, a countdown timer shows "Next round in Xm Ys".

The logic:
1. Find the most recent `endedAt` timestamp across all matches in the latest round
2. Add the tournament's `breaks` value (in minutes) to get the expected next-round start time
3. Use `setInterval` ticking every second to update the displayed time

```js
const nextRoundAt = latestEndedAt + (tournament.breaks ?? 0) * 60 * 1000;
const remaining = Math.max(0, Math.floor((nextRoundAt - Date.now()) / 1000));
```

When the countdown hits 0, it shows "Next round starting soon — waiting for the admin to begin."

### Bracket
The `rounds` array from the backend is a 2D array: `rounds[roundIndex][matchIndex]`. Each match card shows player names and highlights the winner with a CSS class. Match cards that have a `matchId` are wrapped in a `<Link to={/game/${matchId}}>` so players can jump straight into their game.

---

## 4. Backend — Tournament Service — `backend/project/services/tournament.service.js`

### getAllTournaments
I added `.populate('trophy', 'title image')` and `.populate('gameCategory', 'numberOfRounds gameRules timeController')` so the list endpoint returns populated trophy and game category data, not just ObjectIds. This is what allows the TournamentCard to display trophy images and game variants.

### joinTournament
Added a check that blocks joining if the tournament status is `"finished"` or `"cancelled"`. Uses `.equals()` instead of `===` for the duplicate-check because MongoDB ObjectIds are not plain strings.

### leaveTournament
Changed the leave restriction from `status !== "upcoming"` to `["finished", "cancelled"].includes(status)`. This means players can now leave during ongoing tournaments too, which matches the spec ("Users can leave a tournament at any point").

### knockoutRounds — points-based format
The original code was knockout-style (only winners advanced). I rewrote it so **all participants play every round**. Players are shuffled randomly each round and paired up. If there is an odd number of players, the last one sits out (gets a bye).

The function also:
- Blocks starting a new round if the previous round still has unfinished matches
- Blocks starting more rounds than `tournament.numberOfRounds`
- Changes status from `"upcoming"` to `"ongoing"` when the first round starts

### deleteTournament
Uses `findOneAndDelete` by `tournamentId`. Returns the deleted document (useful for confirmation).

### cancelTournament
Sets `status = "cancelled"` and saves. Throws an error if already finished or already cancelled.

---

## 5. Backend — Match Service — Tournament Winner Detection — `backend/project/services/match.service.js`

When a match is recorded as finished, the service checks if it belongs to a tournament. The old code used a knockout win condition (`lastRound.length === 1`). I replaced it with a points-based check:

1. Get all match IDs across all rounds of the tournament
2. Count how many are still unfinished
3. Check that all rounds have been played (`rounds.length >= numberOfRounds`)
4. If both conditions pass: count wins per participant across all matches
5. The participant with the most wins is the tournament winner

```js
const winCounts = {};
for (const m of allMatches) {
    if (m.winner) {
        const wId = m.winner.toString();
        winCounts[wId] = (winCounts[wId] || 0) + 1;
    }
}
const sorted = Object.entries(winCounts).sort((a, b) => b[1] - a[1]);
const winnerId = sorted[0]?.[0];
```

On tournament completion:
- Trophy is pushed to the winner's `trophies` array using `$push`
- The winner gets 500 bonus coins using `$inc: { coins: 500 }`
- Tournament status is set to `"finished"`

---

## 6. Backend — Tournament Model — `backend/project/models/Tournament.js`

I added three new schema fields that were missing from the original:

```js
eloMin: { type: Number, default: null },
eloMax: { type: Number, default: null },
buyIn:  { type: Number, min: 0, default: 0 },
```

These let admins restrict who can join a tournament by their Elo rating and require a coin buy-in.

---

## 7. Backend — Constants — `backend/project/config/constants.js`

Added `"cancelled"` to `TOURNAMENT_STATUS`:

```js
export const TOURNAMENT_STATUS = ["upcoming", "ongoing", "finished", "cancelled"];
```

This constant is used in both the Tournament model (as an enum) and the validator, so updating it in one place keeps them in sync.

---

## 8. Backend — Tournament Routes — `backend/project/routes/tournament.routes.js`

Added two new admin-only routes:

```js
tournamentApiRouter.delete('/tournaments/:tournamentId', requireAdmin, ...deleteTournament);
tournamentApiRouter.put('/tournaments/:tournamentId/cancel', requireAdmin, ...cancelTournament);
```

The leave route (`DELETE /tournaments/:tournamentId/leave`) is defined **before** the delete route (`DELETE /tournaments/:tournamentId`) so Express matches the more specific path first and does not accidentally route leave requests to the delete handler.

---

## 9. Backend — Tournament Validator — `backend/project/validators/tournament.validator.js`

Added optional validation for the three new fields in `validateCreateTournament`:

```js
body("eloMin").optional().isInt({ min: 0 }).toInt(),
body("eloMax").optional().isInt({ min: 0 }).toInt(),
body("buyIn").optional().isInt({ min: 0 }).toInt()
```

Using `.optional()` means these fields are only validated when present — admins do not have to provide them when creating a tournament.

Also exported `validateGetTournament` as an alias for `validateTournamentId` in the default export so the routes file can call it by a more descriptive name.

---

## 10. Sound Effects — How They Work

No audio files are used anywhere in this project. All sounds are generated live in the browser using the **Web Audio API**, which is built into every modern browser on `window`.

### How the Web Audio API works

You build a signal chain of nodes and connect them together, ending at `ac.destination` (the speakers):

```
Source (oscillator or noise) → Filter (optional) → Gain (volume) → ac.destination
```

#### AudioContext
Everything starts with an `AudioContext`. Browsers block it from being created until the user has clicked or pressed something, so it is created lazily on first use:

```js
let _audioCtx = null;
function getAudioCtx() {
    if (!_audioCtx) _audioCtx = new AudioContext();
    if (_audioCtx.state === 'suspended') _audioCtx.resume();
    return _audioCtx;
}
```

The `.resume()` call is needed because even after creation, the browser can suspend the context — calling resume() before playing unblocks it.

#### Source type 1 — Oscillator
An oscillator generates a pure mathematical tone at a set frequency (Hz). You pick a waveform shape which changes how it sounds:

```js
osc.type = 'sine'      // smooth, pure tone — like a flute
osc.type = 'triangle'  // softer, slightly hollow — like a muted bell
osc.type = 'square'    // buzzy, retro — like old video games
osc.type = 'sawtooth'  // harsh, bright — like a synth
```

#### Source type 2 — AudioBuffer (noise)
Instead of a tone, you fill a buffer with random numbers to create noise/texture:

```js
// White noise — all frequencies equally, sounds like static or rain
data[i] = Math.random() * 2 - 1;
```

Noise is then shaped with a BiquadFilter:
```js
filter.type = 'lowpass'   // cuts high frequencies → muffled thud
filter.type = 'highpass'  // cuts low frequencies → hiss or air
filter.type = 'bandpass'  // keeps only a narrow range → focused rattle
```

#### Frequency sweep (glide)
Instead of a flat tone you can sweep up or down — this is how `playClick` works:
```js
osc.frequency.setValueAtTime(440, ac.currentTime);
osc.frequency.exponentialRampToValueAtTime(220, ac.currentTime + 0.08);
// sweeps from 440Hz down to 220Hz in 80ms — feels like a button press
```

#### Finding note frequencies
Every musical note has a fixed Hz value. Each octave doubles the frequency (A3=220Hz, A4=440Hz, A5=880Hz):

| Note | Hz | Note | Hz |
|------|----|------|----|
| C4 (middle C) | 261 | C5 | 523 |
| E4 | 330 | E5 | 659 |
| G4 | 392 | G5 | 784 |
| A4 | 440 | Ab5 | 415 |
| F4 | 349 | F5 | 698 |

The `playJoin` chord uses C5 (523Hz) + E5 (659Hz) + G5 (784Hz) — that is a C major chord.
The `playRoundEnd` chord uses C5 → Ab5 → F5 — descending to signal the round is closing.

#### Volume envelope (Gain)
A GainNode controls volume over time. Ramping to near-zero instead of stopping abruptly prevents a harsh click:
```js
gain.gain.setValueAtTime(0.15, ac.currentTime);        // start at volume 0.15
gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.1); // fade out over 100ms
```

---

### Sounds in `useSoundEffects.js` (React hook — used by React components)

#### playClick
Oscillator sweeping from 440Hz down to 220Hz over 80ms. Descending pitch feels like pressing something. Used on button presses and navigation.

#### playJoin
Three sine oscillators playing C (523Hz), E (659Hz), G (784Hz) staggered 100ms apart — a short ascending C major fanfare. Used when a player joins a game and when the game ends.

#### playRoundEnd (added by me)
Three oscillators playing C (523Hz), Ab (415Hz), F (349Hz) staggered 120ms apart — a descending chord. The descending direction (the opposite of `playJoin`) signals the round is closing.

#### Wiring in Game.jsx
Sounds are triggered by WebSocket messages from the server:
- `all-joined` → `playJoin()`
- `game-started` → `playClick()`
- `round-end` → `playRoundEnd()`
- `game-end` → `playJoin()`
- Player clicks "Roll again" (hold selection) → `playHold()` from the die component

Note: `playRoll` was intentionally removed from Game.jsx because the die Web Component plays its own roll sound directly — having both caused them to overlap. The die-level sound is better because it fires in sync with the visual spin animation.

---

### Sounds in `dice-poker-die.js` (Web Component — can't use React hooks)

Web Components live inside Shadow DOM and have no access to React context or hooks. So the sounds here are standalone functions using the same Web Audio API directly. The sound preference is read from `localStorage` because that is where `AppearanceContext` stores it:

```js
function isSoundEnabled() {
    try {
        return JSON.parse(localStorage.getItem('preferences') || '{}').soundEnabled !== false;
    } catch { return true; }
}
```

#### playDieRollSound
A single triangle-wave oscillator at 1000Hz lasting 100ms. Triangle waves are softer than sine waves — they sound gentle rather than piercing.

**Debounce:** all 5 dice call `roll()` at the same time when the server sends new values. Without a debounce that would fire 5 overlapping sounds. A module-level timestamp (`_lastRollSound`) blocks any repeat call within 200ms so only one sound fires per roll event:

```js
let _lastRollSound = 0;
function playDieRollSound() {
    const now = Date.now();
    if (now - _lastRollSound < 200) return; // skip if already played within 200ms
    _lastRollSound = now;
    // ... play sound
}
```

#### playDieHoldSound
A sine wave at 1400Hz lasting 60ms. The higher frequency makes it clearly distinct from the roll sound so players can hear the difference between rolling and holding.

---

## 11. Dice Roll Animation — `frontend/src/components/dice-poker-die.js`

### How it works

When the server sends new dice values after a roll, `setDice()` in the board sets each die's `face` attribute to the real result and then calls `die.roll()`. Without any animation the face just instantly jumps to the new value which feels abrupt.

To make it feel more alive, `roll()` runs a slot-machine style spin: the face cycles through random values every 50ms for 300ms before snapping to the real result. This is the same concept as the animation from oblig 1.

```
0ms    → shake animation starts, spin starts, first random face shown, sound plays
50ms   → new random face
100ms  → new random face
...
300ms  → real face revealed (snap back)
350ms  → shake animation ends
```

### Key detail — never touching `_face`

The game is server-driven: the real face value is already stored in `this._face` before `roll()` is called. During the spin I only update `this.refs.faceEl.textContent` directly — I never change `_face` or the attribute. This means the game state is never corrupted by the animation. When the spin finishes, `updateUI()` is called which reads the already-correct `_face` and restores everything properly.

```js
// During spin — only the visible text changes, not the internal state
this.refs.faceEl.textContent = randomFace;

// After spin — snap back to real value without touching _face
this.updateUI();
```

### The faces used
The random faces shown during the spin are `['A', 'K', 'Q', 'J', '10', '9']` — the same Spanish poker dice values the server can send, so the spinning looks realistic and not out of place.

### Sound + animation in sync
The roll sound fires at the very start of `roll()`, so the sound and the start of the visual spin happen at exactly the same moment. The debounce ensures only one sound fires even though all 5 dice call `roll()` simultaneously.

---

## 12. Removing Background Music — `frontend/src/contexts/AppearanceContext.jsx`

The original code played a looping `.wav` file as background music using `new Audio(...)`. I removed this entirely — the `audioRef`, the music creation `useEffect`, and the play/pause `useEffect` are all gone. The `soundEnabled` preference still exists and still controls whether game sounds play, but there is no more background music. Only in-game sound effects remain.

---

## 13. Platform Activity on Homepage — `frontend/src/pages/Home.jsx`

The homepage fetches platform activity stats alongside the other data using `Promise.all`. I added `.catch(() => null)` specifically to the `getActivity()` call:

```js
getActivity().catch(() => null)
```

This is important because if the activity endpoint is down or throws an error, `activityData` becomes `null` instead of rejecting the whole `Promise.all` and crashing the page with "Failed to load data". The activity section in the JSX uses `{activity && ...}` so it simply does not render when `activityData` is null. The rest of the page (lobby games, top games, tournaments) loads normally.

The stats section shows:
- Number of ongoing matches right now — from `countDocuments({ status: "ongoing" })`
- Number of unique players active in the last 7 days — uses a JavaScript `Set` to deduplicate player IDs across recent matches

---

## 14. Trophy Images — Linking Frontend to /public/

Trophy images are stored as filenames (e.g. `spring-trophy.png`) in the Trophy model's `image` field. The actual files live in `/frontend/public/` and are served at `/<filename>` by Vite's static asset serving.

Three places display trophies:

**TournamentCard** — shows a small inline image next to the trophy title in the card's metadata area.

**TournamentPage** — shows a larger image in the dedicated Trophy section. The `src` is always `/${tournament.trophy.image}`.

**tournament.service.js (`getAllTournaments`)** — fixed the populate call from `'title imageUrl'` to `'title image'` because the Trophy model field is named `image`, not `imageUrl`. Without this fix, the image field would come back as `undefined` on the list page and homepage.

---

## 15. Tournament Auto-Start — `frontend/src/pages/TournamentPage.jsx`

The exam spec says tournaments start automatically when the scheduled date arrives — no admin button needed. I implemented this with two separate `useEffect` hooks, each guarded by a `useRef` flag to prevent duplicate calls.

### First round (when tournament date arrives)

```js
const autoStartedRef = useRef(false);

useEffect(() => {
    if (!tournament || !user) return;
    if (tournament.status !== 'upcoming') return;
    if ((tournament.participants?.length ?? 0) < 2) return;
    if (autoStartedRef.current) return;

    const target = new Date(tournament.date).getTime();
    const remaining = target - Date.now();

    const fire = () => {
        autoStartedRef.current = true;
        startRound(id)
            .then(updated => setTournament(updated))
            .catch(() => getTournament(id).then(updated => setTournament(updated)));
    };

    if (remaining <= 0) { fire(); }
    else {
        const timer = setTimeout(fire, remaining);
        return () => clearTimeout(timer);
    }
}, [tournament?.tournamentId, tournament?.status, tournament?.participants?.length, user, id]);
```

The dependency array uses `tournament?.tournamentId` instead of the whole `tournament` object so this effect does not re-run every time any field on the tournament changes — only when the tournament itself changes identity. `autoStartedRef` prevents the effect from firing twice if the component re-renders while the timeout is pending.

The `.catch` fallback re-fetches the tournament instead of crashing. This handles the case where two users are both viewing the page and both try to start the round at the same moment — the second call will fail (backend rejects it), but the fallback re-fetch gets the already-started tournament.

### Subsequent rounds (after each break countdown hits zero)

Inside the countdown `useEffect`, when `remaining === 0`:

```js
const nextRoundFiredRef = useRef(false);

if (remaining === 0 && !nextRoundFiredRef.current) {
    nextRoundFiredRef.current = true;
    startRound(id)
        .then(updated => setTournament(updated))
        .catch(() => getTournament(id).then(updated => setTournament(updated)));
}
// cleanup resets the flag so EACH new break can also auto-start
return () => {
    clearInterval(interval);
    nextRoundFiredRef.current = false;
};
```

The cleanup function resets `nextRoundFiredRef` to `false` when the countdown effect re-runs (which happens when `tournament` changes, e.g., after a new round starts). This means each round's break can auto-trigger the next round independently.

---

## 16. Auto-Redirect Players to Their Game — `frontend/src/pages/TournamentPage.jsx`

The spec says players are automatically redirected from the tournament page to their game when a round starts. I implemented this with a `useEffect` that watches the tournament state:

```js
const redirectedRef = useRef(false);

useEffect(() => {
    if (!tournament || !user || tournament.status !== 'ongoing') return;
    if (redirectedRef.current) return;

    const latestRound = tournament.rounds[tournament.rounds.length - 1];
    for (const match of latestRound) {
        if (!match || match.status !== 'ongoing') continue;
        const isPlayer = match.players?.some(
            pl => (pl._id ?? pl)?.toString() === user._id?.toString()
        );
        if (isPlayer && match.matchId) {
            redirectedRef.current = true;
            navigate(`/game/${match.matchId}`, { state: { tournamentId: tournament.tournamentId } });
            return;
        }
    }
}, [tournament, user, navigate]);
```

`redirectedRef` prevents the redirect from firing again when the user navigates back after finishing their game — without it, they would immediately be sent back to the game again.

The `navigate` call passes `tournamentId` in the `state` object. `Game.jsx` reads this with `useLocation()` and shows a "Back to tournament" button on the game-end screen. This is how the round-trip works: tournament → game (auto-redirect) → game ends → "Back to tournament" button → tournament page (standings updated).

---

## 17. Standings Section — `frontend/src/pages/TournamentPage.jsx`

Standings are computed client-side from the `tournament.standings` array that the backend returns. Each entry in the array is `{ round: N, winners: [userObj, ...] }`. I build a win-count map across all rounds:

```js
const winMap = {};
for (const roundData of (tournament.standings ?? [])) {
    for (const winner of (roundData.winners ?? [])) {
        const wId = (winner._id ?? winner)?.toString();
        if (!wId) continue;
        if (!winMap[wId]) winMap[wId] = { username: winner.username ?? '?', wins: 0 };
        winMap[wId].wins++;
    }
}
// Include all participants so players with 0 wins still appear
for (const p of (tournament.participants ?? [])) {
    const pId = (p._id ?? p)?.toString();
    if (pId && !winMap[pId]) winMap[pId] = { username: p.username ?? '?', wins: 0 };
}
const standingsList = Object.values(winMap).sort((a, b) => b.wins - a.wins);
```

Including all participants (not just winners) is important so players who haven't won a match yet still appear in the table with 0 wins, rather than disappearing from the standings until they win something.

The leading player gets a highlighted CSS class (`tournament-detail__standings-row--leader`) to make them visually stand out.

---

## 18. Admin Tournament Edit Page — `frontend/src/pages/admin/TournamentEdit.jsx`

The individual tournament page shows an "Edit tournament" button for admins. Clicking it navigates to `/admin/tournaments/:id/edit`. This is a new admin page I built that pre-fills a form with the existing tournament data.

On mount it calls three APIs in parallel:
- `getTournament(id)` — loads the existing tournament data
- `getAllGameCategories()` — populates the game variant dropdown
- `getAllTrophies()` — populates the trophy dropdown

The date field needs special handling because HTML `<input type="datetime-local">` expects `YYYY-MM-DDTHH:MM` format, not ISO format:

```js
const toDatetimeLocal = (iso) => {
    if (!iso) return "";
    return new Date(iso).toISOString().slice(0, 16);
};
```

On submit it calls `updateTournament(id, { title, description, date, breaks, numberOfRounds, gameCategory, trophy })` and navigates back to the tournament page on success.

I reused `_TournamentCreate.scss` for styling — the form layout is identical to the create page so there was no need for a separate stylesheet.

---

## 19. Backend — Update Tournament — `tournament.service.js`, `tournament.controller.js`, `tournament.validator.js`, `tournament.routes.js`

To support the edit page I added a full backend stack for updating tournaments.

**Validator** — `validateUpdateTournament()`: all fields optional, same validation rules as create. This means an admin can update just the title without having to re-send everything.

**Service** — `updateTournament(tournamentId, updates)`: uses `findOneAndUpdate` with `$set` and `{ new: true }` to return the updated document. Only the fields that are present in `updates` are changed.

**Controller** — `updateTournament`: uses `matchedData(req)` to get validated fields, extracts `tournamentId` from params, passes the rest as `updates`.

**Route**:
```js
tournamentApiRouter.put('/tournaments/:tournamentId', requireAdmin, validateUpdateTournament(), validate, updateTournament);
```

Defined after the `knockoutRounds` route (`PUT /tournaments/:tournamentId/knockoutRounds`) so Express matches the more specific path first.

---

## 20. Fix: Join Button Showing "Join" After Refresh — `frontend/src/pages/TournamentPage.jsx`

After joining a tournament, refreshing the page would show the "Join Tournament" button again, even though the user was already registered. The root cause was an ObjectId comparison bug.

The original code compared participant IDs to the logged-in user's `_id`:
```js
// Broken — ObjectId serialisation varies between Mongoose versions
const alreadyIn = tournament.participants?.some(
    p => p._id?.toString() === user._id?.toString()
);
```

Mongoose documents serialise `_id` differently depending on whether they came from `.toObject()`, `.populate()`, or direct JSON serialisation. The values looked the same when printed but failed strict equality.

The fix: compare by `username` instead, which is always a plain string on both sides:
```js
const alreadyIn = user && tournament.participants?.some(
    p => p.username && p.username === user.username
);
```

I also changed `handleJoin` to re-fetch the full tournament from the server after joining (instead of an optimistic local update). This ensures the participants list matches exactly what MongoDB returns, so `alreadyIn` always has fresh data to check against.

---

## 21. Fix: Auto-Logout When Database Is Reseeded — `frontend/src/contexts/AuthContext.jsx`

When the database is reseeded, all user IDs change. A user who was logged in before the reseed would have a stale `userId` in sessionStorage pointing to a user that no longer exists. On the next API call, the backend returns 404.

I added error handling in the periodic user-status check that runs every 30 seconds:

```js
const checkUserStatus = async () => {
    try {
        const freshUser = await getUser(user.userId);
        if (freshUser?.banned && !bannedMessage) {
            handleBan("Your account has been banned.");
        }
    } catch (error) {
        if (error?.message?.toLowerCase().includes("not found") || error?.status === 404) {
            if (isMounted) logout();
        }
    }
};
```

If the server says the user does not exist (404), `logout()` is called automatically. This clears sessionStorage and resets the auth state so the user is sent to the login page instead of seeing broken behaviour throughout the app.

---

## 22. Fix: Profile Images Not Persisting After Logout — `backend/project/services/user.service.js`

Profile images were stored locally in the browser session (via `updateUserData`) but were never being saved to MongoDB. After logout and login, the image would be gone.

The root cause was that `Object.assign(user, updateObj)` on a Mongoose document does not always reliably mark fields as "modified" in Mongoose's internal change-tracking. When Mongoose's `.save()` sees no modified paths, it sends nothing to MongoDB — the update is silently skipped.

The fix was to switch from the `find + assign + save` pattern to `findOneAndUpdate` with `$set`:

```js
export async function updateUser(userId, updateObj) {
    if (updateObj.password) {
        updateObj.password = hashPassword(updateObj.password);  // hash manually since pre-save hook doesn't run
    }
    const user = await User.findOneAndUpdate(
        { userId },
        { $set: updateObj },
        { new: true, runValidators: false }
    ).select('-password');
    if (!user) throw new CustomError(`User not found`, 404, 'NOT_FOUND');
    return user;
}
```

`$set` sends the update directly to MongoDB without going through Mongoose's document mutation cycle, so there is no risk of silent skipping. `runValidators: false` skips schema validation for the update (the validator middleware on the route already validated the input before it reached the service). Password hashing is done manually here because `findOneAndUpdate` does not trigger pre-save hooks.

I also removed `profileImagePreview` from the `updateUserData` call in `User.jsx` — previously the frontend would store the local file preview in the auth context even if the server had failed to save it, masking the bug:

```js
// Before (masked failed saves):
updateUserData({ profileImage: profileImagePreview || updated.profileImage });

// After (always uses server-confirmed value):
updateUserData({ profileImage: updated.profileImage });
```
