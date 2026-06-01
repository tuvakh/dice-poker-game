// Chanya
// This routes handles tournament creation, joining, and round progression.

import express from "express";
import tournamentController from "../controllers/tournament.controller.js";
import tournamentValidator from "../validators/tournament.validator.js";
import { validate } from "../validators/validate.js";
import { requireAdmin, requireUser } from "../middleware/role.js";

const tournamentApiRouter = express.Router();

// Only admins can create new tournaments
tournamentApiRouter.post('/tournaments', requireAdmin, tournamentValidator.validateCreateTournament(), validate, tournamentController.createTournament);
// Only registered users can be added to the participant list
tournamentApiRouter.post('/tournaments/:tournamentId/join', requireUser, tournamentValidator.validateJoinTournament(), validate, tournamentController.joinTournament);

// Only registered users can leave — allowed at any point until finished/cancelled
tournamentApiRouter.delete('/tournaments/:tournamentId/leave', requireUser, tournamentValidator.validateLeaveTournament(), validate, tournamentController.leaveTournament);

// Remaining participants gets paired together for the next round (points-based — all players play every round)
tournamentApiRouter.put('/tournaments/:tournamentId/knockoutRounds', requireAdmin, tournamentValidator.validateKnockoutRounds(), validate, tournamentController.knockoutRounds);

// Admin delete — permanently removes a tournament
tournamentApiRouter.delete('/tournaments/:tournamentId', requireAdmin, tournamentValidator.validateTournamentId(), validate, tournamentController.deleteTournament);

// Admin cancel — marks tournament as cancelled
tournamentApiRouter.put('/tournaments/:tournamentId/cancel', requireAdmin, tournamentValidator.validateTournamentId(), validate, tournamentController.cancelTournament);

// Admin update — edits title, description, date, and other settings
tournamentApiRouter.put('/tournaments/:tournamentId', requireAdmin, tournamentValidator.validateUpdateTournament(), validate, tournamentController.updateTournament);

// This returns a public, paginated list filterable by status
tournamentApiRouter.get('/tournaments', tournamentValidator.validateGetAllTournaments(), validate, tournamentController.getAllTournaments);
// This returns full details for one tournament, including rounds and standings
tournamentApiRouter.get('/tournaments/:tournamentId', tournamentValidator.validateGetTournament(), validate, tournamentController.getTournament);

export default tournamentApiRouter;
