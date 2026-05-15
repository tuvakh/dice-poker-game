// This controller only handles the HTTP request and response, while the actual logic lives in the service files.
// matchedData(req) gives us the fields that passed validation, instead of raw data from the request.

import { matchedData } from "express-validator";
import gameCategoryServices from "../services/gameCategory.service.js";

// This function returns all 18 game categories
// I didn't add any filtering or pagination here, since the list never gets longer than 18 categories
export async function getAllGameCategories(req, res, next){
    try {
        const result = await gameCategoryServices.getAllGameCategories();
        res.status(200).json(result) 
    // next(error) forwards the error (if any) to middleware/error.js      
    } catch (error) {
        next(error);
    }
}

// This function returns a single game category by its gameCategoryId
export async function getGameCategory(req, res, next){
    try {
        const { gameCategoryId } = matchedData(req);
        const result = await gameCategoryServices.getGameCategory(gameCategoryId);
        res.status(200).json(result) 
    // next(error) forwards the error (if any) to middleware/error.js         
    } catch (error) {
        next(error);
    }
}

// This exports the functions as a default objects, so routes can import them in one line
export default {
    getAllGameCategories,
    getGameCategory
};