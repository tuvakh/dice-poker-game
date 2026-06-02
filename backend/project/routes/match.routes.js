// This route handles match creation and result recording

import express from "express";
import matchController from "../controllers/match.controller.js";
import matchValidator from "../validators/match.validator.js";
import { validate } from "../validators/validate.js";
import { requireAdmin, requireUser } from "../middleware/role.js";


const matchApiRouter = express.Router();

// This creates a new match — only registered users can create matches
matchApiRouter.post('/matches', requireUser, matchValidator.validateCreateMatch(), validate, matchController.createMatch);

// Admin only — the WebSocket endGame function handles normal match results internally
matchApiRouter.put('/matches/:matchId/record', requireAdmin, matchValidator.validateRecordMatch(), validate, matchController.recordMatch);

// This returns a paginated list of matches, filterable by status, category or player
matchApiRouter.get('/matches', matchValidator.validateGetAllMatches(), validate, matchController.getAllMatches);
// This returns a single match with players and category
matchApiRouter.get('/matches/:matchId', matchValidator.validateGetMatch(), validate, matchController.getMatch);

// This adds a user to an existing waiting match — only registered users can join as players
matchApiRouter.post('/matches/:matchId/join', requireUser, matchValidator.validateJoinMatch(), validate, matchController.joinMatch);

// Only registered users can leave their own match
matchApiRouter.delete('/matches/:matchId/leave', requireUser, matchValidator.validateJoinMatch(), validate, matchController.leaveMatch);

export default matchApiRouter;