// This is a public endpoint, so no authentication is required.
// Game categories are read-only and there are always 18 combinations.

import express from "express";
import gameCategoryController from "../controllers/gameCategory.controller.js";
import gameCategoryValidator from "../validators/gameCategory.validator.js";
import { validate } from "../validators/validate.js";

const gameCategoryApiRouter = express.Router();

// This returns all 18 game categories
gameCategoryApiRouter.get('/gamecategories', gameCategoryController.getAllGameCategories);
// This validates the numeric gameCategoryId's before fetching
gameCategoryApiRouter.get('/gamecategories/:gameCategoryId', gameCategoryValidator.validateGameCategoryId(), validate, gameCategoryController.getGameCategory);

export default gameCategoryApiRouter;