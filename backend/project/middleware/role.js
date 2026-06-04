import { verifyToken, getRoleFromToken } from "../utils/jwt.js";
import { Security } from "../models/Security.js";

export async function setUserRole(req, res, next) {
    const accessToken = req.cookies.accessToken;

    if (accessToken) {
        const decoded = verifyToken(accessToken);
        if (decoded) {
            if (decoded.ip && decoded.ip !== req.ip) {
                try {
                    await Security.create({
                        type: 'ip-mismatch',
                        ip: req.ip,
                        userAgent: req.headers['user-agent']
                    });
                } catch (err) {
                    console.error('Failed to log IP mismatch incident:', err);
                }
                return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Session invalid' });
            }
            req.userRole = getRoleFromToken(decoded);
            req.userId = decoded.userId;
            req.mongoId = decoded._id;
            req.username = decoded.username;
            return next();
        }
    }

    req.userRole = "anonymous";
    req.userId = null;
    req.mongoId = null;
    next();
}

export function requireAdmin(req, res, next) {
    if (req.userRole !== "admin") {
        return res.status(403).json({ error: "FORBIDDEN", message: "Nice try, but you need to be an admin to do this" });
    }
    next();
}

export function requireUser(req, res, next) {
    if (req.userRole !== "user" && req.userRole !== "admin") {
        return res.status(403).json({ error: "FORBIDDEN", message: "Who are you? You need to be logged in to do this" });
    }
    next();
}