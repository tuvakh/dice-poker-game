import express from "express";
import tournamentController from "../controllers/tournament.controller.js";
import tournamentValidator from "../validators/tournament.validator.js";
import { validate } from "../validators/validate.js";
import { requireAdmin, requireUser } from "../middleware/role.js";

const tournamentApiRouter = express.Router();

tournamentApiRouter.post('/tournaments', requireAdmin, tournamentValidator.validateCreateTournament(), validate, tournamentController.createTournament);
tournamentApiRouter.post('/tournaments/:tournamentId/join', requireUser, tournamentValidator.validateJoinTournament(), validate, tournamentController.joinTournament);
tournamentApiRouter.delete('/tournaments/:tournamentId/leave', requireUser, tournamentValidator.validateLeaveTournament(), validate, tournamentController.leaveTournament);
tournamentApiRouter.put('/tournaments/:tournamentId/nextRound', requireUser, tournamentValidator.validateStartNextRound(), validate, tournamentController.startNextRound);
tournamentApiRouter.delete('/tournaments/:tournamentId', requireAdmin, tournamentValidator.validateTournamentId(), validate, tournamentController.deleteTournament);
tournamentApiRouter.put('/tournaments/:tournamentId/cancel', requireAdmin, tournamentValidator.validateTournamentId(), validate, tournamentController.cancelTournament);
tournamentApiRouter.put('/tournaments/:tournamentId', requireAdmin, tournamentValidator.validateUpdateTournament(), validate, tournamentController.updateTournament);
tournamentApiRouter.get('/tournaments', tournamentValidator.validateGetAllTournaments(), validate, tournamentController.getAllTournaments);
tournamentApiRouter.get('/tournaments/:tournamentId', tournamentValidator.validateGetTournament(), validate, tournamentController.getTournament);

export default tournamentApiRouter;
