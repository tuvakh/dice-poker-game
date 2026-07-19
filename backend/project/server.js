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
const server = http.createServer(app);

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

const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Blocked by CORS"));
        }
    },
    credentials: true
}));

app.get('/health', (req, res) => {
    res.status(200).json({
        status: "ok",
        timestamp: new Date()
    });
});

app.use(limiter);
app.use(express.json());

app.use(cookieParser());

app.use(setUserRole);

app.use(userApiRouter);
app.use(gameCategoryApiRouter);
app.use(matchApiRouter);
app.use(tournamentApiRouter);
app.use(commentApiRouter);
app.use(activityApiRouter);
app.use(trophyApiRouter);
app.use(adminApiRouter);

app.use(errorHandler);

connectDB()
    .then(() => {
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
        attachWebSocket(server);
        grantWeeklyCoinsBatch();
    })
    
    .catch((err) => {
        console.error('Failed to connect to MongoDB:', err);
    });
