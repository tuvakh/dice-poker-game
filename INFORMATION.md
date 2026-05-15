# Spanish Poker Dice — IDG2100 Oblig 3

## About the project

Spanish Poker Dice is an online platform for playing Spanish poker dice. The platform supports both anonymous and registered users. Registered users can create games, join games, leave comments, track their Elo rating across three time controls (3s, 10s, 30s), and earn trophies from tournaments. Anonymous users can browse, view, and join games that allow anonymous players.

The project consists of:
- A **React** frontend (Vite)
- A **Node.js/Express** REST API backend
- A **MongoDB** database

---

# Installation Guide

## Requirements

- Node.js v18+
- MongoDB running locally

## 1. Backend

Navigate to the backend folder:

```bash
cd backend/project
npm install
```

Create a `.env` file in `backend/project/` with the following variables:

```
DB_HOSTNAME=localhost
DB_PORT=27017
DB_NAME=spanish-poker
NODE_ENV=development
PORT=3000
```

Seed the database with dummy data:

```bash
node seed/db.seed.js
```

Start the backend:

```bash
npm run dev
```

The API will run on `http://localhost:3000`.

## 2. Frontend

Navigate to the frontend folder:

```bash
cd frontend
npm install
npm run dev
```

The app will run on `http://localhost:5173`.

## Notes

- The frontend connects to the backend at `http://localhost:3000` (configured in `frontend/src/api/config.js`).
- Seeded users have the password `password123`.
- Anonymous users can browse and view games. Registered users can create games, join games, and leave comments.

---

## Known limitations

- Real-time game play is not implemented — the game board area is reserved but non-functional. The page polls every 15 seconds to detect new players joining.
- Password reset ("forgot password") is not implemented.
- Tournament creation and moderation features are not implemented (moderator role is out of scope for this sprint).
- Web Sockets are not used; comments and game state require a manual refresh or polling.

---

## Credits

- Elo rating algorithm based on the formula described at [GeeksForGeeks — Elo Rating Algorithm](https://www.geeksforgeeks.org/dsa/elo-rating-algorithm/)
- Profile images and trophy images are placeholder assets for demonstration purposes only.
