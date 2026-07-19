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

- **Stale token after re-seed or server restart** — the app issues a refresh token, but if the database is re-seeded or the server resets, existing tokens become invalid. The app does not detect this and instead silently breaks — API calls fail and the UI stops working correctly without any logout or error prompt to the user.
- **Tournament does not auto-redirect after game completion** — players are redirected from the tournament page to their game, but are not automatically sent back to the tournament page when the game ends. It also doesn't work 100% correctly
- **5-player game layout has bad structure** — It places everyone underneath each other so you ahve to scroll to see the buttons if you're the user on top of the page
- **Weak password strength requirements** — the registration form does give visual feedback on password validation, but the only enforced rule is a minimum of 8 characters. There are no requirements for special characters, numbers, or mixed case, making the password policy weaker than recommended.
- **Email address is not verified to actually exist** — registration only checks that the format is valid, not that the address is reachable. A fake-format email will pass.
- **No winner when no hands are matched** — the game determines the winner purely based on hand rankings. If no player has any recognised hand (no pair, no three of a kind, etc.), the round produces no winner instead of falling back to a highest-dice comparison.