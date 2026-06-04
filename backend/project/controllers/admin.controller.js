import adminService from "../services/admin.service.js";

export async function getStats(req, res, next) {
    try {
        const stats = await adminService.getStats();
        res.status(200).json(stats);
    } catch (err) {
        next(err);
    }
}

export default { getStats };
