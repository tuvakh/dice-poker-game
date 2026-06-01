// This routes is admin only, and handles trophy creation with image upload.

import express from "express";
import trophyController from "../controllers/trophy.controller.js";
import { requireAdmin } from "../middleware/role.js";
import trophyValidator from "../validators/trophy.validator.js";
import { validate } from "../validators/validate.js";
import { upload } from "../middleware/upload.js";

const trophyApiRouter = express.Router();

// Public list — used by the admin form to pick a trophy when creating a tournament
trophyApiRouter.get("/trophies", trophyController.getAllTrophies);
// Only admins can create trophies
trophyApiRouter.post("/trophies", requireAdmin, upload.single("image"), trophyValidator.validateCreateTrophy(), validate, trophyController.createTrophy);

export default trophyApiRouter;