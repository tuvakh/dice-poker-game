// This is an entry point for the API
// It sets up Express, middleware, routes, and starts the server.

import mongoose from 'mongoose';
import express from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from "cookie-parser";
import { fileURLToPath } from 'url';
import attachWebSocket from './webSockets/gameSocket.js';

import { connectDB } from './config/db.config.js';
import { setUserRole } from './middleware/role.js';
import userApiRouter from './routes/user.routes.js';
import gameCategoryApiRouter from './routes/gameCategory.routes.js';
import matchApiRouter from './routes/match.routes.js';
import tournamentApiRouter from './routes/tournament.routes.js';
import commentApiRouter from './routes/comment.routes.js';
import adminApiRouter from './routes/admin.routes.js';
import activityApiRouter from './routes/activity.routes.js';
import rateLimit from 'express-rate-limit';
import trophyApiRouter from './routes/trophy.routes.js';
import { errorHandler } from './middleware/error.js';
import { grantWeeklyCoinsBatch } from './services/scheduler.js';
import { Security } from './models/Security.js';

const app = express();
const PORT = process.env.PORT || 3000;
const server = http.createServer(app); // Express handles HTTP requests

// This limits each IP to 200 requests per minute to prevent abuse
// Normal gameplay uses ~25 req/min (polling + API calls), so this only triggers on actual abuse
const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    handler: async (req, res) => {
        try {
            await Security.create({
                type: 'rate-limit',
                ip: req.ip,
                userAgent: req.headers['user-agent']
            });
        } catch (err) {
            console.error('Failed to log security incident:', err);
        }
        res.status(429).json({ error: 'TOO_MANY_REQUESTS', message: 'Too many requests, please try again later' });
    }
});

app.use(cors({ 
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
    credentials: true // Allow cookies to be sent with requests
}));
app.use(limiter);
// This parse incoming JSON request bodies so controllers can access req.body
app.use(express.json());

// This parses cookies from incoming requests
app.use(cookieParser());

// This runs on every request to attach the user's role to req.userRole
app.use(setUserRole);

// These register all route handlers
app.use(userApiRouter);
app.use(gameCategoryApiRouter);
app.use(matchApiRouter);
app.use(tournamentApiRouter);
app.use(commentApiRouter);
app.use(activityApiRouter);
app.use(trophyApiRouter);
app.use(adminApiRouter);

// This serves uploaded trophy images as static files from the uploads/ folder
// import.meta.url is used to get the absolute path since this is an ES module
// Uploaded images are now stored in the database as data URLs; do not serve local uploads directory.

// The errorHandler must be registered last so it catches errors from all routes above
app.use(errorHandler);

// The server only start listening for requests after the database connection is established
connectDB()
    .then(() => {
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
        attachWebSocket(server);
        grantWeeklyCoinsBatch();
    })
    // if the DB connection fails, log the error and exit
    // The server should not start without a database
    .catch((err) => {
        console.error('Failed to connect to MongoDB:', err);
    });
