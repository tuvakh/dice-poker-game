import express from "express";
import adminController from "../controllers/admin.controller.js";
import { requireAdmin } from "../middleware/role.js";

const adminApiRouter = express.Router();

// Stats endpoint (admin only)
adminApiRouter.get('/admin/stats', requireAdmin, adminController.getStats);

export default adminApiRouter;
