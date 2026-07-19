import express from "express";
import trophyController from "../controllers/trophy.controller.js";
import { requireAdmin } from "../middleware/role.js";
import trophyValidator from "../validators/trophy.validator.js";
import { validate } from "../validators/validate.js";
import { upload } from "../middleware/upload.js";

const trophyApiRouter = express.Router();

trophyApiRouter.get("/trophies", trophyController.getAllTrophies);
trophyApiRouter.post("/trophies", requireAdmin, upload.single("image"), trophyValidator.validateCreateTrophy(), validate, trophyController.createTrophy);

export default trophyApiRouter;