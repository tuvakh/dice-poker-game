// This route handles match creation, result recording, and the matchmaking queue.

import express from "express";
import matchController from "../controllers/match.controller.js";
import matchValidator from "../validators/match.validator.js";
import { validate } from "../validators/validate.js";
import queueController from "../controllers/queue.controller.js";
import queueValidator from "../validators/queue.validator.js";
import { requireUser } from "../middleware/role.js";


const matchApiRouter = express.Router();

// This creates a new match — only registered users can create matches
matchApiRouter.post('/matches', requireUser, matchValidator.validateCreateMatch(), validate, matchController.createMatch);

// This records the result of a finished match, and updates the ELO ratings
matchApiRouter.put('/matches/:matchId/record', matchValidator.validateRecordMatch(), validate, matchController.recordMatch);

// This returns a paginated list of matches, filterable by status, category or player
matchApiRouter.get('/matches', matchValidator.validateGetAllMatches(), validate, matchController.getAllMatches);
// This returns a single match with players and category
matchApiRouter.get('/matches/:matchId', matchValidator.validateGetMatch(), validate, matchController.getMatch);

// This validates if a user can join the matchmaking queue — only registered users can queue
matchApiRouter.post('/matches/queue', requireUser, queueValidator.validateJoinQueue(), validate, queueController.joinQueue);
// This adds a user to an existing waiting match — only registered users can join as players
matchApiRouter.post('/matches/:matchId/join', requireUser, matchValidator.validateJoinMatch(), validate, matchController.joinMatch);

// This removes the player from the matchmaking queue
matchApiRouter.delete('/matches/queue', queueValidator.validateLeaveQueue(), validate, queueController.leaveQueue);
matchApiRouter.delete('/matches/:matchId/leave', matchValidator.validateJoinMatch(), validate, matchController.leaveMatch);

export default matchApiRouter;