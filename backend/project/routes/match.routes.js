import express from "express";
import matchController from "../controllers/match.controller.js";
import matchValidator from "../validators/match.validator.js";
import { validate } from "../validators/validate.js";
import { requireAdmin, requireUser } from "../middleware/role.js";


const matchApiRouter = express.Router();

matchApiRouter.post('/matches', requireUser, matchValidator.validateCreateMatch(), validate, matchController.createMatch);
matchApiRouter.put('/matches/:matchId/record', requireAdmin, matchValidator.validateRecordMatch(), validate, matchController.recordMatch);
matchApiRouter.get('/matches', matchValidator.validateGetAllMatches(), validate, matchController.getAllMatches);
matchApiRouter.get('/matches/:matchId', matchValidator.validateGetMatch(), validate, matchController.getMatch);
matchApiRouter.post('/matches/:matchId/join', requireUser, matchValidator.validateJoinMatch(), validate, matchController.joinMatch);
matchApiRouter.delete('/matches/:matchId/leave', requireUser, matchValidator.validateJoinMatch(), validate, matchController.leaveMatch);

export default matchApiRouter;