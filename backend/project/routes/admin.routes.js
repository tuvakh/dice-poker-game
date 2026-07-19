import express from "express";
import adminController from "../controllers/admin.controller.js";
import { requireAdmin } from "../middleware/role.js";

const adminApiRouter = express.Router();

adminApiRouter.get('/admin/stats', requireAdmin, adminController.getStats);

export default adminApiRouter;
