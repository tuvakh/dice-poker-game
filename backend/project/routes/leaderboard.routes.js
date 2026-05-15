// This route is a public endpoint, so no authentication is required.
// Anyone can view the rankings

import express from "express";
import leaderboardController from "../controllers/leaderboard.controller.js";
import leaderboardValidator from "../validators/leaderboard.validator.js";
import { validate } from "../validators/validate.js";

const leaderboardApiRouter = express.Router();

// This returns ranked users. They are filterable by game category and sortable by wins, winPercentage or matches
leaderboardApiRouter.get('/leaderboards', leaderboardValidator.validateGetRankings(), validate, leaderboardController.getRankings);

export default leaderboardApiRouter;