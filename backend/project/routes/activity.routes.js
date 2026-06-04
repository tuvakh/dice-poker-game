import express from "express";
import activityController from "../controllers/activity.controller.js";

const activityApiRouter = express.Router();

activityApiRouter.get('/activities', activityController.getActivity);

export default activityApiRouter;