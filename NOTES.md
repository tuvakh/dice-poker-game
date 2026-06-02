# Leave below any info you want examiners to see

Including the info on the starter code (whose repository and how used), notes on seeding and launching the app, optional info on the work distribution within the team, and notes on unfinished parts of the project and unpatched bugs.

## Info about the starter code
We used Tuva's repositories from oblig 1, 2 and 3. All of the code from each assignment is used as starter code

## Notes on seeding and launching the app

### Requirements
- Node.js 20.6+ and a MongoDB connection are required.
- The `.env` file is already present in `backend/project/` with all required variables. Its contents for the examiner:

```
NODE_ENV=development
MONGODB_URI=mongodb+srv://team1:team1@hcai-lab.ww8wgz8.mongodb.net/?appName=HCAI-lab

APP_SALT=GiveUpOnYourDreamsAndDieForUsIWillTakeDownTheBeastTitan

EMAIL_HOST=smtp.ethereal.email
EMAIL_PORT=587
EMAIL_USER=pr7hr2b42k4wolys@ethereal.email
EMAIL_PASS=cyWtVu8B99xVFBqvSd
EMAIL_FROM=noreply@example.com
FRONTEND_URL=http://localhost:5173

JWT_SECRET=55f3baa1d48df60b5a62d22b0c40810010844f0eb3aa63fccca11d7486f9748b2986e7103be60cfcbd945816dbc82f2083c50e414362e8f7983dd94f6e42c494
```

Note: the email credentials use [Ethereal](https://ethereal.email/) — a fake SMTP service for testing. Sent emails can be viewed at ethereal.email after logging in with the credentials above.


### Seeding
From `backend/project/`:
```
npm run seed
```
This populates the database with users, game categories, matches, tournaments, trophies, and comments.

### Running the app
**Backend** — from `backend/project/`:
```
npm run dev
```
Starts the Express + WebSocket server on port 3000 with file watching.

**Frontend** — from `frontend/`:
```
npm run dev
```
Starts the Vite dev server, accessible at http://localhost:5173.

## Notes on unfinished work and known bugs

- **Access token does not auto-refresh on expiry** — when the 1-hour access token expires, the user is not automatically logged out or prompted to refresh. They have to log out and back in manually.
- **Email verification re-send not implemented** — the verify-email page shows a success or error message but does not offer to re-send the verification link if the code is expired or invalid.
- **"Played games in the last week" activity stat missing** — the homepage activity section shows active players and live games, but not total games played in the last 7 days as required.
- **Tournament does not auto-redirect after game completion** — players are redirected from the tournament page to their game, but are not automatically sent back to the tournament page when the game ends.
- **5-player game layout is broken** — the game board layout does not handle 5 players well visually.
- **No frontend password strength rules** — password length is validated by the backend (minimum 8 characters) but there is no visual feedback on the registration form.
- **Email address is not verified to actually exist** — registration only checks that the format is valid, not that the address is reachable. A fake-format email will pass.
- **Carta Alta (high card) tiebreaker** — if no player has a named hand, the winner is determined by highest face value. This is correct per the rules, but may appear as if the game has no winner.