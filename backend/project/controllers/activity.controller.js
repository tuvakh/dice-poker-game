import activityServices from "../services/activity.service.js";

export async function getActivity(req, res, next){
    try {
        const result = await activityServices.getActivity();
        res.status(200).json(result) 
    } catch (error) {
        next(error);
    }
}

export default {
    getActivity
};