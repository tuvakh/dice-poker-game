// This controller only handles the HTTP request and response, while the actual logic lives in the service files.

import activityServices from "../services/activity.service.js";

// The getActivity function fetches platform statistics and returns them as a JSON response.
export async function getActivity(req, res, next){
    try {
        const result = await activityServices.getActivity();
        res.status(200).json(result) 
    // next(error) forwards the error (if any) to middleware/error.js   
    } catch (error) {
        next(error);
    }
}

// This exports the function as a default object, so routes can import it in one line
export default {
    getActivity
};