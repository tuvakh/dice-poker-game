# Instructions

## Seeding and launching the app

### Prerequisites
- Node.js 18 or newer
- The `.env` file is already included in `backend/project/` and is pre-configured with a shared MongoDB Atlas database and Ethereal email credentials — no setup needed.

#### .env content (we know we shouldnt share this)

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

### Install dependencies

In two separate terminals, install dependencies for the backend and frontend:

```bash
# Terminal 1 — backend
cd backend/project
npm install

# Terminal 2 — frontend
cd frontend
npm install
```

### Seed the database

From `backend/project/`, run the seed script once before first launch (or any time you want a fresh database):

```bash
cd backend/project
npm run seed
```

This clears and repopulates all collections with sample users, game categories, tournaments, trophies, matches, and comments.

**Admin login credentials (created by the seed):**
- Username: `adminuser`
- Password: `Adminuser7!`

### Launch the app

Start the backend and frontend in separate terminals:

```bash
# Terminal 1 — backend (with auto-restart on file changes)
cd backend/project
npm run dev

# Terminal 2 — frontend
cd frontend
npm run dev
```

The frontend runs at **http://localhost:5173** and the backend at **http://localhost:3000**.

> Both servers must be running at the same time for the app to work. The WebSocket server runs on the same port as the backend (3000).