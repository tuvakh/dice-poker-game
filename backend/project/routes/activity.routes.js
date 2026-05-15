// This route is a public endpoint, so no authentication is required.

import express from "express";
import activityController from "../controllers/activity.controller.js";

const activityApiRouter = express.Router();

// This returns ongoing match counts, active users this week, and last 10 matches
activityApiRouter.get('/activities', activityController.getActivity);

export default activityApiRouter;