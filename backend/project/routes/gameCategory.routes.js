import express from "express";
import gameCategoryController from "../controllers/gameCategory.controller.js";
import gameCategoryValidator from "../validators/gameCategory.validator.js";
import { validate } from "../validators/validate.js";

const gameCategoryApiRouter = express.Router();

gameCategoryApiRouter.get('/gamecategories', gameCategoryController.getAllGameCategories);
gameCategoryApiRouter.get('/gamecategories/:gameCategoryId', gameCategoryValidator.validateGameCategoryId(), validate, gameCategoryController.getGameCategory);

export default gameCategoryApiRouter;