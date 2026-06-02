// Controller handles HTTP only; logic lives in admin.service.js
import adminService from "../services/admin.service.js";

// Returns platform stats for the admin dashboard: new profiles, security incidents, and activity
export async function getStats(req, res, next) {
    try {
        const stats = await adminService.getStats();
        res.status(200).json(stats);
    } catch (err) {
        next(err);
    }
}

export default { getStats };
