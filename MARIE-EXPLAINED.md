# MARIE-EXPLAINED

This branch contains the work needed to move the project toward a cleaner, exam-safe auth and email flow, while keeping the current app working.

## What Changed

### 1. Email verification and password reset mail
- The backend mailer was changed so verification and reset emails are handled through Ethereal for development/testing.
- The mail flow was adjusted so the backend can send emails during registration and password reset without relying on the old test-site style flow.
- The email templates still build verification and reset links from `FRONTEND_URL`.
- I also tested the mail flow locally by sending a verification email and checking that Ethereal preview URLs were produced.

### 2. Authentication and authorization
- The old header-based role trust was removed so the server no longer depends on spoofable client headers like `X-User-Role`.
- Login now uses signed JWT-based auth.
- The access token is set as an HTTP-only cookie so the browser sends it automatically.
- The backend middleware now reads the authenticated user from the verified token instead of trusting the client.
- The password flow was upgraded to use Node crypto-based hashing with support for legacy hashes during migration.

### 3. Frontend auth cleanup
- Frontend API requests were updated to use `credentials: 'include'` so cookie-based auth works consistently.
- Client-side auth storage was simplified so the code no longer keeps stale sessionStorage-based token state in multiple places.
- The admin and user API modules were cleaned up so they no longer rely on the old bearer/header pattern.

### 4. Password handling fix
- A bug was found where passwords were being hashed more than once.
- That caused login to fail even when the correct password was typed.
- The duplicate hashing path was removed so passwords are hashed once and can be checked correctly at login.

### 5. Cleanup of duplicate or confusing code
- Unused auth helpers and old token-storage logic were removed from the frontend.
- Redundant password hashing code paths were removed from the backend service layer.
- The branch was cleaned so the auth flow is easier to reason about and less likely to drift between files.

## Validation I Ran
- Frontend production build succeeded.
- Mail delivery was tested locally through Ethereal preview URLs.
- Password hashing and password comparison were checked locally.
- The backend server was started and restarted locally during debugging, including fixing port conflicts caused by leftover Node processes.

## Notes
- This branch still keeps some backend refresh-token support for compatibility, but the frontend now follows the cookie-based auth path.
- The branch also includes the merge of upstream `master`, so the current state is a combination of the earlier feature work and the latest upstream changes.

### 7. Homepage component cleanup
- The Home page was split across `Home.jsx` (shell) and `HomeDetails.jsx` (content), causing maintenance overhead.
- Collapsed the logic back into a single `Home.jsx` file with all async data fetching, ELO sorting, and idle-loading deferral included.
- Removed `HomeDetails.jsx` entirely to simplify imports and state management.
- The page still displays hero, platform activity, available games, top games, and tournaments.

### 8. Email verification gate removed for existing users
- Existing account holders were forced through email verification on login even though they already had accounts.
- Removed the `if (!user.emailVerified)` check from the `loginUser()` function in `user.service.js`.
- Verification email is still sent on account creation, but it no longer blocks login for existing users.
- Users can now log in immediately and verify later if they choose.

### 9. Leaderboard profile pictures
- Leaderboard was only displaying username initials, ignoring the stored `profileImage` field.
- Added conditional rendering in `LeaderBoard.jsx`: if a player has a profile image, display it; otherwise show the username initial.
- Profile images now appear alongside the player rankings, improving user identity recognition.

### 10. Profile picture styling refinement
- Profile pictures were wrapped in a colored avatar badge with gradient background, which cluttered the display.
- Removed the colored wrapper so only the actual profile images are shown when available.
- Fallback initial badges are still displayed for users without profile pictures.

### 11. Profile picture and avatar sizing consistency
- Profile pictures and fallback initials were rendering at different sizes, creating visual misalignment.
- Added CSS rule in `_LeaderBoard.scss` to ensure both profile images and fallback badges are exactly 3rem × 3rem.
- Styling now uses `.leaderboard-list__player .player-info__image { width: 3rem; height: 3rem; flex-shrink: 0; }` to match the avatar badge sizing.

### 12. Seed data generation for testing
- Created 10 finished matches where BeevieKu wins all games as test data.
- Updated `match.seed.js` to find BeevieKu by username, assign them as the winner in all 10 finished matches, and adjust ELO deltas accordingly (+24 for BeevieKu, -24 for opponent).
- Executed `npm run seed` to populate the database with these test games.
- Enables easier testing of win streaks and leaderboard positioning.

### 13. Waiting game player count display on game cards
- Game cards in Lobby, Home, LeaderBoard, and Tournament pages didn't indicate how many players were still needed to start a game.
- Added `GameCard.jsx` logic to calculate `currentPlayers` from `match.players.length` and `requiredPlayers` from `match.maxPlayers`.
- Only shown for waiting-status games (not displayed in "topGames" or "recentGames" variants to keep those contexts clean).
- Display format: `{currentPlayers}/{requiredPlayers} players` (e.g., "1/2 players").
- Added corresponding CSS styling in `main.css` with `.game-card__waiting`, `.game-card__waiting-text`, and `.game-card__waiting-count` classes.

### 14. Waiting player count display on in-game waiting screen
- When players were inside a waiting game, they saw "Waiting for other players to join..." but no indication of how many had joined.
- Added player count display to the `Game.jsx` waiting overlay: `{match.players.length}/{match.maxPlayers ?? 2} players`.
- Added `game__waiting-count` CSS class in `_Game.scss` to style the count as smaller text (1.2rem font-size, regular weight, normal text color).
- Now when waiting for opponents to join or waiting to start, players see clear feedback like "Waiting for other players to join... 1/2 players".

## Validation I Ran
- Frontend production build succeeded after each major change.
- Syntax validation performed on all modified components.
- Database seed executed successfully with all 10 BeevieKu wins inserted.
- Game card component tested across multiple contexts (Lobby, Home, LeaderBoard) with no breakage.
- Waiting screen tested for proper player count display and styling.

## Notes
- The `GameCard` component reuses across 5+ page contexts with conditional variant props to control styling and link text.
- Profile picture sizing uses targeted CSS scoping to avoid unintended cascading effects.
- Seed data updates are incremental; subsequent runs reset all data atomically.
- All changes maintain backward compatibility and don't break existing features.

## Summary
In short, all work done includes:
- **Earlier work** (from MARIE branch): authentication security, email verification setup, password handling, and auth cleanup.
- **Recent work** (this session): homepage restructuring, removing email verification blocks, adding profile pictures to leaderboard, seeding test data, and adding player count feedback on waiting games.
- Together, these changes make the app cleaner, more secure, and provide better user feedback on game readiness.
